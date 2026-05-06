package com.inventory.application.mapper;

import com.inventory.application.dto.*;
import com.inventory.domain.model.*;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

/**
 * Mapper manual para los nuevos modelos de dominio de la extensión v2.
 * Cubre: imágenes, redes sociales, catálogo proveedor, deudas, notificaciones, sync incidents.
 */
@Component
public class SupplementaryApplicationMapper {

    public CustomerImageDto toDto(CustomerImage img) {
        return new CustomerImageDto(
            img.id(), img.customerId(), img.sortOrder(), img.isPrimary(),
            img.contentType(), img.filePath(), img.originalFilename(),
            img.sizeBytes(), img.createdAt()
        );
    }

    public SupplierImageDto toDto(SupplierImage img) {
        return new SupplierImageDto(
            img.id(), img.supplierId(), img.sortOrder(), img.isPrimary(),
            img.contentType(), img.filePath(), img.originalFilename(),
            img.sizeBytes(), img.createdAt()
        );
    }

    public ProductImageDto toDto(ProductImage img) {
        return new ProductImageDto(
            img.id(), img.productId(), img.sortOrder(), img.isPrimary(),
            img.contentType(), img.filePath(), img.originalFilename(),
            img.sizeBytes(), img.createdAt()
        );
    }

    public SupplierSocialLinkDto toDto(SupplierSocialLink link) {
        return new SupplierSocialLinkDto(
            link.id(), link.supplierId(),
            link.platform() != null ? link.platform().name() : null,
            link.url(), link.label(), link.sortOrder()
        );
    }

    public SupplierCatalogProductDto toDto(SupplierCatalogProduct p) {
        return new SupplierCatalogProductDto(
            p.id(), p.supplierId(), p.productId(),
            p.description(), p.unitPrice(), p.currencyCode()
        );
    }

    public CustomerDebtDto toDto(CustomerDebt debt) {
        BigDecimal pending = debt.getOriginalAmount().subtract(debt.getPaidAmount());
        return new CustomerDebtDto(
            debt.getId(), debt.getCustomerId(), debt.getSaleId(),
            debt.getOriginalAmount(), debt.getPaidAmount(), pending,
            debt.getCurrencyCode(),
            debt.getStatus() != null ? debt.getStatus().name() : null,
            debt.getDescription(), debt.getDueDate(), debt.getNotes(),
            debt.getCreatedAt(), debt.getUpdatedAt()
        );
    }

    public DebtPaymentDto toDto(DebtPayment payment) {
        return new DebtPaymentDto(
            payment.id(), payment.debtId(),
            payment.amount(),
            payment.paymentMethod() != null ? payment.paymentMethod().name() : null,
            payment.notes(), payment.registeredBy(), payment.createdAt()
        );
    }

    public NotificationDto toDto(Notification n, boolean read) {
        return new NotificationDto(
            n.id(),
            n.source() != null ? n.source().name() : null,
            n.category() != null ? n.category().name() : null,
            n.title(), n.body(),
            n.targetType() != null ? n.targetType().name() : null,
            n.targetUserId(), n.createdBy(),
            n.entityType(), n.entityId(),
            n.createdAt(), read
        );
    }

    public SyncIncidentDto toDto(SyncIncident incident) {
        return new SyncIncidentDto(
            incident.getId(), incident.getDeviceId(), incident.getOperationId(),
            incident.getEntityType(), incident.getEntityId(),
            incident.getIncidentType() != null ? incident.getIncidentType().name() : null,
            incident.getStatus() != null ? incident.getStatus().name() : null,
            incident.getMyPayload(), incident.getServerPayload(),
            incident.getResolution(), incident.getUserId(),
            incident.getCreatedAt(), incident.getResolvedAt()
        );
    }
}
