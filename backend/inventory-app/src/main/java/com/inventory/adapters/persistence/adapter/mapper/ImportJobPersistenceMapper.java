package com.inventory.adapters.persistence.adapter.mapper;

import com.inventory.adapters.persistence.adapter.entity.ImportJobEntity;
import com.inventory.domain.model.importjob.ImportJob;
import com.inventory.domain.model.importjob.ImportStatus;
import org.springframework.stereotype.Component;

@Component
public class ImportJobPersistenceMapper {

    public ImportJobEntity toEntity(ImportJob domain) {
        ImportJobEntity entity = new ImportJobEntity();
        entity.setId(domain.getId());
        entity.setType(domain.getType());
        entity.setStatus(domain.getStatus().name());
        entity.setOriginalFilename(domain.getOriginalFilename());
        entity.setMappingJson(domain.getMappingJson());
        entity.setResultJson(domain.getResultJson());
        entity.setErrorMessage(domain.getErrorMessage());
        entity.setCreatedBy(domain.getCreatedBy());
        entity.setCreatedAt(domain.getCreatedAt());
        entity.setUpdatedAt(domain.getUpdatedAt());
        return entity;
    }

    public ImportJob toDomain(ImportJobEntity entity) {
        return new ImportJob(
            entity.getId(),
            entity.getType(),
            ImportStatus.valueOf(entity.getStatus()),
            entity.getOriginalFilename(),
            entity.getMappingJson(),
            entity.getResultJson(),
            entity.getErrorMessage(),
            entity.getCreatedBy(),
            entity.getCreatedAt(),
            entity.getUpdatedAt()
        );
    }
}
