package com.inventory.adapters.persistence.adapter.repository;

import com.inventory.adapters.persistence.adapter.entity.ImportJobEntity;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ImportJobR2dbcRepository extends ReactiveCrudRepository<ImportJobEntity, UUID> {
}
