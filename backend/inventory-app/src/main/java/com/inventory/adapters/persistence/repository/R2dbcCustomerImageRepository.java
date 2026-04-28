package com.inventory.adapters.persistence.repository;

import com.inventory.adapters.persistence.entity.CustomerImageEntity;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

public interface R2dbcCustomerImageRepository extends ReactiveCrudRepository<CustomerImageEntity, UUID> {

    @Query("SELECT * FROM customer_images WHERE customer_id = :customerId ORDER BY sort_order ASC")
    Flux<CustomerImageEntity> findByCustomerId(UUID customerId);

    @Query("DELETE FROM customer_images WHERE customer_id = :customerId")
    Mono<Void> deleteByCustomerId(UUID customerId);
}
