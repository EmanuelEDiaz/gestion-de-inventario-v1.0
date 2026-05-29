package com.inventory.application.usecase.query.importjob;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.inventory.application.dto.importjob.ImportResponse;
import com.inventory.domain.model.importjob.ImportJob;
import com.inventory.domain.ports.out.ImportJobRepository;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.Map;
import java.util.UUID;

@Service
public class GetImportJobStatusQuery {

    private final ImportJobRepository importJobRepository;
    private final ObjectMapper objectMapper;

    public GetImportJobStatusQuery(ImportJobRepository importJobRepository,
                                    ObjectMapper objectMapper) {
        this.importJobRepository = importJobRepository;
        this.objectMapper = objectMapper;
    }

    public Mono<ImportResponse> execute(UUID id) {
        return importJobRepository.findById(id)
            .map(this::toResponse);
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
