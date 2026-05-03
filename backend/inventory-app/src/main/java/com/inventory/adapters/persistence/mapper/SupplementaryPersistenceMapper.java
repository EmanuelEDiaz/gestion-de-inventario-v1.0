package com.inventory.adapters.persistence.mapper;

import com.inventory.adapters.persistence.entity.*;
import com.inventory.domain.model.*;
import org.springframework.stereotype.Component;

/**
 * Mapper manual para las entidades suplementarias añadidas en V9:
 * CustomerDebt, DebtPayment, CustomerImage, SupplierImage,
 * SupplierSocialLink, SupplierCatalogProduct,
 * Notification, NotificationRead, SyncIncident.
 */
@Component
public class SupplementaryPersistenceMapper {

    // ==================== CustomerDebt ====================

    public CustomerDebt toDomain(CustomerDebtEntity e) {
        if (e == null) return null;
        return new CustomerDebt(
            e.getId(),
            e.getCustomerId(),
            e.getSaleId(),
            e.getOriginalAmount(),
            e.getPaidAmount(),
            e.getCurrencyCode(),
            CustomerDebt.DebtStatus.valueOf(e.getStatus()),
            e.getDescription(),
            e.getDueDate(),
            e.getNotes(),
            e.getCreatedAt(),
            e.getUpdatedAt(),
            e.getVersion() != null ? e.getVersion() : 0L
        );
    }

    public CustomerDebtEntity toEntity(CustomerDebt d, boolean isNew) {
        if (d == null) return null;
        CustomerDebtEntity e = new CustomerDebtEntity();
        e.setId(d.getId());
        e.setCustomerId(d.getCustomerId());
        e.setSaleId(d.getSaleId());
        e.setOriginalAmount(d.getOriginalAmount());
        e.setPaidAmount(d.getPaidAmount());
        e.setCurrencyCode(d.getCurrencyCode());
        e.setStatus(d.getStatus().name());
        e.setDescription(d.getDescription());
        e.setDueDate(d.getDueDate());
        e.setNotes(d.getNotes());
        e.setCreatedAt(d.getCreatedAt());
        e.setUpdatedAt(d.getUpdatedAt());
        e.setVersion(d.getVersion());
        e.setNew(isNew);
        return e;
    }

    // ==================== DebtPayment ====================

    public DebtPayment toDomain(DebtPaymentEntity e) {
        if (e == null) return null;
        return new DebtPayment(
            e.getId(),
            e.getDebtId(),
            e.getAmount(),
            DebtPayment.PaymentMethod.valueOf(e.getPaymentMethod()),
            e.getNotes(),
            e.getRegisteredBy(),
            e.getCreatedAt()
        );
    }

    public DebtPaymentEntity toEntity(DebtPayment d, boolean isNew) {
        if (d == null) return null;
        DebtPaymentEntity e = new DebtPaymentEntity();
        e.setId(d.id());
        e.setDebtId(d.debtId());
        e.setAmount(d.amount());
        e.setPaymentMethod(d.paymentMethod().name());
        e.setNotes(d.notes());
        e.setRegisteredBy(d.registeredBy());
        e.setCreatedAt(d.createdAt());
        e.setNew(isNew);
        return e;
    }

    // ==================== CustomerImage ====================

    public CustomerImage toDomain(CustomerImageEntity e) {
        if (e == null) return null;
        return new CustomerImage(
            e.getId(),
            e.getCustomerId(),
            e.getSortOrder(),
            e.isPrimary(),
            e.getContentType(),
            e.getFilePath(),
            e.getOriginalFilename(),
            e.getSizeBytes(),
            e.getCreatedAt()
        );
    }

    public CustomerImageEntity toEntity(CustomerImage d, boolean isNew) {
        if (d == null) return null;
        CustomerImageEntity e = new CustomerImageEntity();
        e.setId(d.id());
        e.setCustomerId(d.customerId());
        e.setSortOrder(d.sortOrder());
        e.setPrimary(d.isPrimary());
        e.setContentType(d.contentType());
        e.setFilePath(d.filePath());
        e.setOriginalFilename(d.originalFilename());
        e.setSizeBytes(d.sizeBytes());
        e.setCreatedAt(d.createdAt());
        e.setNew(isNew);
        return e;
    }

    // ==================== SupplierImage ====================

    public SupplierImage toDomain(SupplierImageEntity e) {
        if (e == null) return null;
        return new SupplierImage(
            e.getId(),
            e.getSupplierId(),
            e.getSortOrder(),
            e.isPrimary(),
            e.getContentType(),
            e.getFilePath(),
            e.getOriginalFilename(),
            e.getSizeBytes(),
            e.getCreatedAt()
        );
    }

    public SupplierImageEntity toEntity(SupplierImage d, boolean isNew) {
        if (d == null) return null;
        SupplierImageEntity e = new SupplierImageEntity();
        e.setId(d.id());
        e.setSupplierId(d.supplierId());
        e.setSortOrder(d.sortOrder());
        e.setPrimary(d.isPrimary());
        e.setContentType(d.contentType());
        e.setFilePath(d.filePath());
        e.setOriginalFilename(d.originalFilename());
        e.setSizeBytes(d.sizeBytes());
        e.setCreatedAt(d.createdAt());
        e.setNew(isNew);
        return e;
    }

    // ==================== ProductImage ====================

    public ProductImage toDomain(ProductImageEntity e) {
        if (e == null) return null;
        return new ProductImage(
            e.getId(),
            e.getProductId(),
            e.getSortOrder(),
            e.isPrimary(),
            e.getContentType(),
            e.getFilePath(),
            e.getOriginalFilename(),
            e.getSizeBytes(),
            e.getCreatedAt()
        );
    }

    public ProductImageEntity toEntity(ProductImage d, boolean isNew) {
        if (d == null) return null;
        ProductImageEntity e = new ProductImageEntity();
        e.setId(d.id());
        e.setProductId(d.productId());
        e.setSortOrder(d.sortOrder());
        e.setPrimary(d.isPrimary());
        e.setContentType(d.contentType());
        e.setFilePath(d.filePath());
        e.setOriginalFilename(d.originalFilename());
        e.setSizeBytes(d.sizeBytes());
        e.setCreatedAt(d.createdAt());
        e.setNew(isNew);
        return e;
    }

    // ==================== SupplierSocialLink ====================

    public SupplierSocialLink toDomain(SupplierSocialLinkEntity e) {
        if (e == null) return null;
        return new SupplierSocialLink(
            e.getId(),
            e.getSupplierId(),
            SupplierSocialLink.Platform.valueOf(e.getPlatform()),
            e.getUrl(),
            e.getLabel(),
            e.getSortOrder()
        );
    }

    public SupplierSocialLinkEntity toEntity(SupplierSocialLink d, boolean isNew) {
        if (d == null) return null;
        SupplierSocialLinkEntity e = new SupplierSocialLinkEntity();
        e.setId(d.id());
        e.setSupplierId(d.supplierId());
        e.setPlatform(d.platform().name());
        e.setUrl(d.url());
        e.setLabel(d.label());
        e.setSortOrder(d.sortOrder());
        e.setNew(isNew);
        return e;
    }

    // ==================== SupplierCatalogProduct ====================

    public SupplierCatalogProduct toDomain(SupplierCatalogProductEntity e) {
        if (e == null) return null;
        return new SupplierCatalogProduct(
            e.getId(),
            e.getSupplierId(),
            e.getProductId(),
            e.getDescription(),
            e.getUnitPrice(),
            e.getCurrencyCode()
        );
    }

    public SupplierCatalogProductEntity toEntity(SupplierCatalogProduct d, boolean isNew) {
        if (d == null) return null;
        SupplierCatalogProductEntity e = new SupplierCatalogProductEntity();
        e.setId(d.id());
        e.setSupplierId(d.supplierId());
        e.setProductId(d.productId());
        e.setDescription(d.description());
        e.setUnitPrice(d.unitPrice());
        e.setCurrencyCode(d.currencyCode());
        e.setNew(isNew);
        return e;
    }

    // ==================== Notification ====================

    public Notification toDomain(NotificationEntity e) {
        if (e == null) return null;
        return new Notification(
            e.getId(),
            Notification.NotificationType.valueOf(e.getType()),
            Notification.NotificationCategory.valueOf(e.getCategory()),
            e.getTitle(),
            e.getBody(),
            Notification.TargetType.valueOf(e.getTargetType()),
            e.getTargetUserId(),
            e.getCreatedBy(),
            e.getEntityType(),
            e.getEntityId(),
            e.getCreatedAt()
        );
    }

    public NotificationEntity toEntity(Notification d, boolean isNew) {
        if (d == null) return null;
        NotificationEntity e = new NotificationEntity();
        e.setId(d.id());
        e.setType(d.type().name());
        e.setCategory(d.category().name());
        e.setTitle(d.title());
        e.setBody(d.body());
        e.setTargetType(d.targetType().name());
        e.setTargetUserId(d.targetUserId());
        e.setCreatedBy(d.createdBy());
        e.setEntityType(d.entityType());
        e.setEntityId(d.entityId());
        e.setCreatedAt(d.createdAt());
        e.setNew(isNew);
        return e;
    }

    // ==================== NotificationRead ====================

    public NotificationRead toDomain(NotificationReadEntity e) {
        if (e == null) return null;
        return new NotificationRead(e.getNotificationId(), e.getUserId(), e.getReadAt());
    }

    public NotificationReadEntity toEntity(NotificationRead d) {
        if (d == null) return null;
        return new NotificationReadEntity(d.notificationId(), d.userId(), d.readAt());
    }

    // ==================== SyncIncident ====================

    public SyncIncident toDomain(SyncIncidentEntity e) {
        if (e == null) return null;
        return new SyncIncident(
            e.getId(),
            e.getDeviceId(),
            e.getOperationId(),
            e.getEntityType(),
            e.getEntityId(),
            SyncIncident.IncidentType.valueOf(e.getIncidentType()),
            SyncIncident.IncidentStatus.valueOf(e.getStatus()),
            e.getMyPayload(),
            e.getServerPayload(),
            e.getResolution(),
            e.getUserId(),
            e.getCreatedAt(),
            e.getResolvedAt()
        );
    }

    public SyncIncidentEntity toEntity(SyncIncident d, boolean isNew) {
        if (d == null) return null;
        SyncIncidentEntity e = new SyncIncidentEntity();
        e.setId(d.getId());
        e.setDeviceId(d.getDeviceId());
        e.setOperationId(d.getOperationId());
        e.setEntityType(d.getEntityType());
        e.setEntityId(d.getEntityId());
        e.setIncidentType(d.getIncidentType().name());
        e.setStatus(d.getStatus().name());
        e.setMyPayload(d.getMyPayload());
        e.setServerPayload(d.getServerPayload());
        e.setResolution(d.getResolution());
        e.setUserId(d.getUserId());
        e.setCreatedAt(d.getCreatedAt());
        e.setResolvedAt(d.getResolvedAt());
        e.setNew(isNew);
        return e;
    }
}
