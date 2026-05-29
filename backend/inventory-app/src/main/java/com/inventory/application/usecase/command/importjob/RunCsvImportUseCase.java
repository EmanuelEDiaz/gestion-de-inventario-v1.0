package com.inventory.application.usecase.command.importjob;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.inventory.application.dto.importjob.ImportResponse;
import com.inventory.domain.errors.ImportException;
import com.inventory.domain.model.importjob.ImportJob;
import com.inventory.domain.ports.out.ImportJobRepository;
import com.inventory.domain.ports.out.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class RunCsvImportUseCase {

    private final ImportJobRepository importJobRepository;
    private final ProductRepository productRepository;
    private final CsvParser csvParser;
    private final ObjectMapper objectMapper;

    public RunCsvImportUseCase(ImportJobRepository importJobRepository,
                                ProductRepository productRepository,
                                CsvParser csvParser,
                                ObjectMapper objectMapper) {
        this.importJobRepository = importJobRepository;
        this.productRepository = productRepository;
        this.csvParser = csvParser;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public Mono<ImportResponse> execute(String csvContent, String filename,
                                         String type, String mappingJson, UUID userId) {
        Map<String, String> mapping = parseMapping(mappingJson);
        String detectedType = type != null ? type : detectType(mapping);

        ImportJob job = ImportJob.create(detectedType, filename, mappingJson, userId);
        ImportJob processingJob = job.withStatus(com.inventory.domain.model.importjob.ImportStatus.PROCESSING);

        return importJobRepository.save(processingJob)
            .then(Mono.fromCallable(() -> csvParser.parse(csvContent, mapping)))
            .flatMap(parseResult -> processImport(detectedType, parseResult, userId))
            .flatMap(resultJson -> {
                ImportJob completed = processingJob.withResult(resultJson);
                return importJobRepository.save(completed)
                    .thenReturn(toResponse(completed));
            })
            .onErrorResume(e -> {
                ImportJob failed = processingJob.withError(e.getMessage());
                return importJobRepository.save(failed)
                    .thenReturn(toResponse(failed));
            });
    }

    @Transactional
    public Mono<ImportResponse> executeDryRun(String csvContent, String filename,
                                               String type, String mappingJson, UUID userId) {
        Map<String, String> mapping = parseMapping(mappingJson);
        String detectedType = type != null ? type : detectType(mapping);

        ImportJob job = ImportJob.create(detectedType, filename, mappingJson, userId);

        return Mono.fromCallable(() -> csvParser.parse(csvContent, mapping))
            .flatMap(parseResult -> {
                if (!parseResult.errors().isEmpty()) {
                    Map<String, Object> result = new HashMap<>();
                    result.put("totalRows", parseResult.rows().size() + parseResult.errors().size());
                    result.put("validRows", parseResult.rows().size());
                    result.put("errorCount", parseResult.errors().size());
                    result.put("errors", parseResult.errors());
                    result.put("headers", parseResult.headers());
                    result.put("sampleRows", parseResult.rows().subList(0, Math.min(5, parseResult.rows().size())));

                    try {
                        String resultStr = objectMapper.writeValueAsString(result);
                        return importJobRepository.save(job.withResult(resultStr))
                            .thenReturn(toResponse(job.withResult(resultStr)));
                    } catch (JsonProcessingException e) {
                        return Mono.error(new ImportException("Error serializando resultado", e));
                    }
                }

                Map<String, Object> result = new HashMap<>();
                result.put("totalRows", parseResult.rows().size());
                result.put("validRows", parseResult.rows().size());
                result.put("errorCount", 0);
                result.put("errors", List.of());
                result.put("headers", parseResult.headers());
                result.put("sampleRows", parseResult.rows().subList(0, Math.min(5, parseResult.rows().size())));

                try {
                    String resultStr = objectMapper.writeValueAsString(result);
                    return importJobRepository.save(job.withResult(resultStr))
                        .thenReturn(toResponse(job.withResult(resultStr)));
                } catch (JsonProcessingException e) {
                    return Mono.error(new ImportException("Error serializando resultado", e));
                }
            })
            .onErrorResume(e -> {
                ImportJob failed = job.withError(e.getMessage());
                return importJobRepository.save(failed)
                    .thenReturn(toResponse(failed));
            });
    }

    private Mono<String> processImport(String type, CsvParser.CsvParseResult parseResult, UUID userId) {
        if (!parseResult.errors().isEmpty()) {
            return createErrorResult(parseResult);
        }

        if ("PRODUCT".equals(type)) {
            return importProducts(parseResult, userId);
        }

        return Mono.error(new ImportException("Tipo de importación no soportado: " + type));
    }

    private Mono<String> importProducts(CsvParser.CsvParseResult parseResult, UUID userId) {
        Map<String, Object> result = new HashMap<>();
        result.put("totalRows", parseResult.rows().size());
        result.put("headers", parseResult.headers());

        return Flux.fromIterable(parseResult.rows())
            .flatMap(row -> importProductRow(row))
            .collectList()
            .flatMap(importedProducts -> {
                long imported = importedProducts.stream().filter(Boolean::booleanValue).count();
                long failed = importedProducts.size() - imported;

                result.put("importedRows", (int) imported);
                result.put("failedRows", (int) failed);
                result.put("errorCount", (int) failed);
                result.put("validRows", (int) imported);

                try {
                    return Mono.just(objectMapper.writeValueAsString(result));
                } catch (JsonProcessingException e) {
                    return Mono.error(new ImportException("Error serializando resultado", e));
                }
            });
    }

    private Mono<Boolean> importProductRow(Map<String, String> row) {
        String sku = row.getOrDefault("sku", "");
        String name = row.getOrDefault("name", "");

        if (name.isBlank()) {
            return Mono.just(false);
        }

        java.math.BigDecimal salePrice = parseDecimal(row.get("salePrice"));
        java.math.BigDecimal standardCost = parseDecimal(row.get("standardCost"));

        return productRepository.existsBySku(sku)
            .flatMap(exists -> {
                if (exists) {
                    return productRepository.findBySku(sku)
                        .flatMap(product -> {
                            product = product.updateBasicInfo(name, row.get("description"), sku, row.get("barcode"));
                            if (salePrice != null) product = product.updatePricing(standardCost, salePrice, null);
                            return productRepository.save(product).thenReturn(true);
                        });
                }
                return productRepository.save(
                    com.inventory.domain.model.product.Product.create(
                        name, sku, row.get("barcode"), salePrice != null ? salePrice : java.math.BigDecimal.ZERO
                    )
                ).thenReturn(true);
            })
            .onErrorResume(e -> Mono.just(false));
    }

    private Mono<String> createErrorResult(CsvParser.CsvParseResult parseResult) {
        Map<String, Object> result = new HashMap<>();
        result.put("totalRows", parseResult.rows().size() + parseResult.errors().size());
        result.put("validRows", parseResult.rows().size());
        result.put("errorCount", parseResult.errors().size());
        result.put("importedRows", 0);
        result.put("failedRows", 0);
        result.put("errors", parseResult.errors());
        result.put("headers", parseResult.headers());

        try {
            return Mono.just(objectMapper.writeValueAsString(result));
        } catch (JsonProcessingException e) {
            return Mono.error(new ImportException("Error serializando resultado", e));
        }
    }

    private String detectType(Map<String, String> mapping) {
        if (mapping.containsKey("sku") || mapping.containsKey("name")) {
            return "PRODUCT";
        }
        if (mapping.containsKey("email")) {
            return "CUSTOMER";
        }
        return "PRODUCT";
    }

    private java.math.BigDecimal parseDecimal(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return new java.math.BigDecimal(value.replace(",", "."));
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private Map<String, String> parseMapping(String mappingJson) {
        try {
            return objectMapper.readValue(mappingJson, Map.class);
        } catch (Exception e) {
            throw new ImportException("Mapping JSON inválido", e);
        }
    }

    private ImportResponse toResponse(ImportJob job) {
        Map<String, Object> resultJson = null;
        if (job.getResultJson() != null) {
            try {
                resultJson = objectMapper.readValue(job.getResultJson(), Map.class);
            } catch (Exception ignored) {}
        }

        return new ImportResponse(
            job.getId(),
            job.getType(),
            job.getStatus().name(),
            job.getOriginalFilename(),
            resultJson,
            job.getErrorMessage(),
            job.getCreatedBy(),
            job.getCreatedAt(),
            job.getUpdatedAt()
        );
    }
}
