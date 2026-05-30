package com.inventory.application.mapper;

import com.inventory.application.customer.dto.CustomerDebtDto;
import com.inventory.application.customer.dto.CustomerImageDto;
import com.inventory.application.customer.dto.DebtPaymentDto;
import com.inventory.application.notification.dto.NotificationDto;
import com.inventory.application.notification.dto.NotificationPreferencesResponse;
import com.inventory.application.notification.dto.NotificationResponse;
import com.inventory.application.notification.dto.NotificationScheduleResponse;
import com.inventory.application.product.dto.ProductImageDto;
import com.inventory.application.supplier.dto.SupplierCatalogProductDto;
import com.inventory.application.supplier.dto.SupplierImageDto;
import com.inventory.application.supplier.dto.SupplierSocialLinkDto;
import com.inventory.application.dto.sync.SyncIncidentDto;
import com.inventory.domain.model.customer.CustomerDebt;
import com.inventory.domain.model.customer.CustomerImage;
import com.inventory.domain.model.customer.DebtPayment;
import com.inventory.domain.model.notification.Notification;
import com.inventory.domain.model.notification.NotificationPreference;
import com.inventory.domain.model.notification.NotificationSchedule;
import com.inventory.domain.model.product.ProductImage;
import com.inventory.domain.model.supplier.SupplierCatalogProduct;
import com.inventory.domain.model.supplier.SupplierImage;
import com.inventory.domain.model.supplier.SupplierSocialLink;
import com.inventory.domain.model.sync.SyncIncident;
import com.inventory.domain.model.user.UserImage;
import com.inventory.application.user.dto.UserImageDto;
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
        return toDto(n, read, null);
    }

    public NotificationDto toDto(Notification n, boolean read, String createdByName) {
        return new NotificationDto(
            n.id(),
            n.source() != null ? n.source().name() : null,
            n.category() != null ? n.category().name() : null,
            n.title(), n.body(),
            n.targetType() != null ? n.targetType().name() : null,
            n.targetUserId(), n.createdBy(),
            createdByName,
            n.entityType(), n.entityId(),
            n.createdAt(), read
        );
    }

    public NotificationResponse toNotificationResponse(Notification n, boolean read) {
        return new NotificationResponse(
            n.id(),
            n.source() != null ? n.source().name() : null,
            n.category() != null ? n.category().name() : null,
            n.priority() != null ? n.priority().name() : "MEDIUM",
            n.title(),
            n.body(),
            n.actionUrl(),
            n.tags(),
            n.deliveryChannel(),
            n.targetType() != null ? n.targetType().name() : null,
            n.targetUserId(),
            n.createdBy(),
            n.entityType(),
            n.entityId(),
            n.createdAt(),
            read
        );
    }

    public NotificationPreferencesResponse toNotificationPreferencesResponse(
        com.inventory.adapters.persistence.adapter.entity.NotificationPreferencesEntity entity
    ) {
        return new NotificationPreferencesResponse(
            entity.getId(),
            entity.getUserId(),
            entity.getEnabled(),
            entity.getLowStockEnabled(),
            entity.getSyncEnabled(),
            entity.getOperationsEnabled(),
            entity.getDebtEnabled(),
            entity.getUserActionsEnabled(),
            entity.getSystemEnabled(),
            entity.getPushNotificationsEnabled(),
            entity.getToastNotificationsEnabled(),
            entity.getSseEnabled(),
            entity.getSoundEnabled(),
            entity.getDesktopNotificationEnabled(),
            entity.getCreatedAt(),
            entity.getUpdatedAt()
        );
    }

    public NotificationPreferencesResponse toNotificationPreferencesResponse(
        NotificationPreference domain
    ) {
        return new NotificationPreferencesResponse(
            domain.id(),
            domain.userId(),
            domain.enabled(),
            domain.lowStockEnabled(),
            domain.syncEnabled(),
            domain.operationsEnabled(),
            domain.debtEnabled(),
            domain.userActionsEnabled(),
            domain.systemEnabled(),
            domain.pushNotificationsEnabled(),
            domain.toastNotificationsEnabled(),
            domain.sseEnabled(),
            domain.soundEnabled(),
            domain.desktopNotificationEnabled(),
            domain.createdAt(),
            domain.updatedAt()
        );
    }

    public NotificationScheduleResponse toNotificationScheduleResponse(
        com.inventory.adapters.persistence.adapter.entity.NotificationSchedulesEntity entity
    ) {
        java.util.List<Integer> quietDays = entity.getQuietDaysList() != null
            ? java.util.Arrays.asList(entity.getQuietDaysList())
            : java.util.List.of();
        
        return new NotificationScheduleResponse(
            entity.getId(),
            entity.getUserId(),
            entity.getQuietHoursStart(),
            entity.getQuietHoursEnd(),
            entity.getQuietHoursEnabled(),
            quietDays,
            entity.getBypassOnCritical(),
            entity.getCreatedAt(),
            entity.getUpdatedAt()
        );
    }

    public NotificationScheduleResponse toNotificationScheduleResponse(
        NotificationSchedule domain
    ) {
        return new NotificationScheduleResponse(
            domain.id(),
            domain.userId(),
            domain.quietHoursStart(),
            domain.quietHoursEnd(),
            domain.quietHoursEnabled(),
            domain.quietDaysList(),
            domain.bypassOnCritical(),
            domain.createdAt(),
            domain.updatedAt()
        );
    }

    public UserImageDto toDto(UserImage img) {
        if (img == null) return null;
        return new UserImageDto(
            img.id(), img.userId(), img.contentType(), img.filePath(),
            img.originalFilename(), img.sizeBytes(), img.createdAt()
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
