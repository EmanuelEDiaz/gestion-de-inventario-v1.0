package com.inventory.application.usecase.command;

import com.inventory.domain.errors.NotFoundException;
import com.inventory.domain.model.supplier.SupplierSocialLink;
import com.inventory.domain.ports.in.supplier.SupplierSocialLinkCommandPort;
import com.inventory.domain.ports.out.SupplierSocialLinkRepository;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * Caso de uso: comandos sobre redes sociales de proveedores.
 */
@Service
public class SupplierSocialLinkCommandUseCase implements SupplierSocialLinkCommandPort {

    private final SupplierSocialLinkRepository supplierSocialLinkRepository;

    public SupplierSocialLinkCommandUseCase(SupplierSocialLinkRepository supplierSocialLinkRepository) {
        this.supplierSocialLinkRepository = supplierSocialLinkRepository;
    }

    @Override
    public Mono<SupplierSocialLink> add(AddCommand command) {
        SupplierSocialLink link = SupplierSocialLink.create(
            command.supplierId(),
            command.platform(),
            command.url(),
            command.label(),
            command.sortOrder()
        );
        return supplierSocialLinkRepository.save(link);
    }

    @Override
    public Mono<Void> delete(UUID linkId) {
        return supplierSocialLinkRepository.findById(linkId)
            .switchIfEmpty(Mono.error(new NotFoundException("SupplierSocialLink not found: " + linkId)))
            .flatMap(link -> supplierSocialLinkRepository.deleteById(linkId));
    }

    @Override
    public Flux<SupplierSocialLink> listBySupplierId(UUID supplierId) {
        return supplierSocialLinkRepository.findBySupplierId(supplierId);
    }
}
