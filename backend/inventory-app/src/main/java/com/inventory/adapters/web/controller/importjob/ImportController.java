package com.inventory.adapters.web.controller.importjob;

import com.inventory.application.dto.importjob.ImportResponse;
import com.inventory.application.usecase.command.importjob.RunCsvImportUseCase;
import com.inventory.application.usecase.query.importjob.GetImportJobStatusQuery;
import org.springframework.http.HttpStatus;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.util.UUID;
import org.springframework.core.io.buffer.DataBufferUtils;
import static org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE;

@RestController
@RequestMapping("/api/v1/imports")
public class ImportController {

    private final RunCsvImportUseCase runCsvImportUseCase;
    private final GetImportJobStatusQuery getImportJobStatusQuery;

    public ImportController(RunCsvImportUseCase runCsvImportUseCase,
                             GetImportJobStatusQuery getImportJobStatusQuery) {
        this.runCsvImportUseCase = runCsvImportUseCase;
        this.getImportJobStatusQuery = getImportJobStatusQuery;
    }

    @PostMapping(value = "/csv", consumes = MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public Mono<ImportResponse> uploadCsv(
        @RequestPart("file") FilePart file,
        @RequestPart("mapping") String mapping,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID userId = extractUserId(userDetails);
        return readFileContent(file)
            .flatMap(content -> runCsvImportUseCase.execute(
                content, file.filename(), null, mapping, userId));
    }

    @PostMapping(value = "/dry-run", consumes = MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public Mono<ImportResponse> dryRun(
        @RequestPart("file") FilePart file,
        @RequestPart("mapping") String mapping,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID userId = extractUserId(userDetails);
        return readFileContent(file)
            .flatMap(content -> runCsvImportUseCase.executeDryRun(
                content, file.filename(), null, mapping, userId));
    }

    @GetMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public Mono<ImportResponse> getStatus(@PathVariable UUID id) {
        return getImportJobStatusQuery.execute(id)
            .switchIfEmpty(Mono.error(
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Import job no encontrado")));
    }

    @GetMapping("/{id}/result")
    @PreAuthorize("hasRole('ADMIN')")
    public Mono<ImportResponse> getResult(@PathVariable UUID id) {
        return getImportJobStatusQuery.execute(id)
            .switchIfEmpty(Mono.error(
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Import job no encontrado")));
    }

    private Mono<String> readFileContent(FilePart file) {
        return DataBufferUtils.join(file.content())
            .map(dataBuffer -> {
                byte[] bytes = new byte[dataBuffer.readableByteCount()];
                dataBuffer.read(bytes);
                DataBufferUtils.release(dataBuffer);
                return new String(bytes, StandardCharsets.UTF_8);
            });
    }

    private UUID extractUserId(UserDetails userDetails) {
        try {
            return UUID.fromString(userDetails.getUsername());
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario inválido");
        }
    }
}
