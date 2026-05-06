package com.inventory.domain.model;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;

/**
 * Tests unitarios para la entidad de dominio Notification.
 * Sin Spring — dominio puro.
 */
@DisplayName("Notification Domain Entity")
class NotificationTest {

    @Test
    @DisplayName("createSystem() genera notificación del sistema con defaults")
    void createSystem_setsDefaults() {
        UUID userId = UUID.randomUUID();
        UUID productId = UUID.randomUUID();

        Notification notif = Notification.createSystem(
            Notification.NotificationCategory.LOW_STOCK,
            Notification.NotificationPriority.MEDIUM,
            "Stock bajo",
            "Producto X tiene stock < 10",
            Notification.TargetType.USER,
            userId,
            "PRODUCT",
            productId
        );

        assertThat(notif.id()).isNotNull();
        assertThat(notif.source()).isEqualTo(Notification.NotificationSource.SYSTEM);
        assertThat(notif.priority()).isEqualTo(Notification.NotificationPriority.MEDIUM);
        assertThat(notif.title()).isEqualTo("Stock bajo");
        assertThat(notif.body()).isEqualTo("Producto X tiene stock < 10");
        assertThat(notif.targetUserId()).isEqualTo(userId);
        assertThat(notif.entityType()).isEqualTo("PRODUCT");
        assertThat(notif.entityId()).isEqualTo(productId);
        assertThat(notif.createdAt()).isNotNull();
        assertThat(notif.actionUrl()).isNull();
        assertThat(notif.tags()).isEmpty();
        assertThat(notif.deliveryChannel()).isEqualTo("SSE");
        assertThat(notif.createdBy()).isNull();
    }

    @Test
    @DisplayName("createManual() genera notificación de usuario")
    void createManual_createsUserNotification() {
        UUID userId = UUID.randomUUID();
        UUID createdBy = UUID.randomUUID();

        Notification notif = Notification.createManual(
            "Título manual",
            "Descripción manual",
            Notification.TargetType.USER,
            userId,
            createdBy
        );

        assertThat(notif.source()).isEqualTo(Notification.NotificationSource.USER);
        assertThat(notif.category()).isEqualTo(Notification.NotificationCategory.MANUAL);
        assertThat(notif.priority()).isEqualTo(Notification.NotificationPriority.MEDIUM);
        assertThat(notif.createdBy()).isEqualTo(createdBy);
    }

    @Test
    @DisplayName("Constructor lanza excepción cuando source es null")
    void constructor_throwsWhenSourceIsNull() {
        assertThatThrownBy(() ->
            new Notification(
                UUID.randomUUID(),
                null,  // source = null
                Notification.NotificationCategory.MANUAL,
                Notification.NotificationPriority.MEDIUM,
                "Title",
                "Body",
                null,
                List.of(),
                "SSE",
                Notification.TargetType.USER,
                UUID.randomUUID(),
                null,
                null,
                null,
                Instant.now()
            )
        ).isInstanceOf(IllegalArgumentException.class)
         .hasMessageContaining("source cannot be null");
    }

    @Test
    @DisplayName("Constructor lanza excepción cuando category es null")
    void constructor_throwsWhenCategoryIsNull() {
        assertThatThrownBy(() ->
            new Notification(
                UUID.randomUUID(),
                Notification.NotificationSource.SYSTEM,
                null,  // category = null
                Notification.NotificationPriority.MEDIUM,
                "Title",
                "Body",
                null,
                List.of(),
                "SSE",
                Notification.TargetType.USER,
                UUID.randomUUID(),
                null,
                null,
                null,
                Instant.now()
            )
        ).isInstanceOf(IllegalArgumentException.class)
         .hasMessageContaining("category cannot be null");
    }

    @Test
    @DisplayName("Constructor lanza excepción cuando priority es null")
    void constructor_throwsWhenPriorityIsNull() {
        assertThatThrownBy(() ->
            new Notification(
                UUID.randomUUID(),
                Notification.NotificationSource.SYSTEM,
                Notification.NotificationCategory.MANUAL,
                null,  // priority = null
                "Title",
                "Body",
                null,
                List.of(),
                "SSE",
                Notification.TargetType.USER,
                UUID.randomUUID(),
                null,
                null,
                null,
                Instant.now()
            )
        ).isInstanceOf(IllegalArgumentException.class)
         .hasMessageContaining("priority cannot be null");
    }

    @Test
    @DisplayName("Constructor lanza excepción cuando title es vacío")
    void constructor_throwsWhenTitleIsBlank() {
        assertThatThrownBy(() ->
            new Notification(
                UUID.randomUUID(),
                Notification.NotificationSource.SYSTEM,
                Notification.NotificationCategory.MANUAL,
                Notification.NotificationPriority.MEDIUM,
                "",  // title = blank
                "Body",
                null,
                List.of(),
                "SSE",
                Notification.TargetType.USER,
                UUID.randomUUID(),
                null,
                null,
                null,
                Instant.now()
            )
        ).isInstanceOf(IllegalArgumentException.class)
         .hasMessageContaining("title cannot be blank");
    }

    @Test
    @DisplayName("Constructor lanza excepción cuando targetType=USER pero targetUserId es null")
    void constructor_throwsWhenTargetUserIdMissingForUserTarget() {
        assertThatThrownBy(() ->
            new Notification(
                UUID.randomUUID(),
                Notification.NotificationSource.SYSTEM,
                Notification.NotificationCategory.MANUAL,
                Notification.NotificationPriority.MEDIUM,
                "Title",
                "Body",
                null,
                List.of(),
                "SSE",
                Notification.TargetType.USER,
                null,  // targetUserId = null but targetType = USER
                null,
                null,
                null,
                Instant.now()
            )
        ).isInstanceOf(IllegalArgumentException.class)
         .hasMessageContaining("targetUserId required when targetType is USER");
    }

    @Test
    @DisplayName("Constructor inicializa id y createdAt cuando son null")
    void constructor_initializesIdAndCreatedAtWhenNull() {
        Notification notif = new Notification(
            null,  // id = null
            Notification.NotificationSource.SYSTEM,
            Notification.NotificationCategory.MANUAL,
            Notification.NotificationPriority.MEDIUM,
            "Title",
            "Body",
            null,
            List.of(),
            "SSE",
            Notification.TargetType.ALL,
            null,
            null,
            null,
            null,
            null  // createdAt = null
        );

        assertThat(notif.id()).isNotNull();
        assertThat(notif.createdAt()).isNotNull();
    }

    @Test
    @DisplayName("Constructor inicializa tags como lista vacía si es null")
    void constructor_initializeEmptyTagsWhenNull() {
        Notification notif = new Notification(
            UUID.randomUUID(),
            Notification.NotificationSource.SYSTEM,
            Notification.NotificationCategory.MANUAL,
            Notification.NotificationPriority.MEDIUM,
            "Title",
            "Body",
            null,
            null,  // tags = null
            "SSE",
            Notification.TargetType.ALL,
            null,
            null,
            null,
            null,
            Instant.now()
        );

        assertThat(notif.tags()).isEmpty();
    }

    @Test
    @DisplayName("Constructor inicializa deliveryChannel como SSE si es null")
    void constructor_initializeDeliveryChannelWhenNull() {
        Notification notif = new Notification(
            UUID.randomUUID(),
            Notification.NotificationSource.SYSTEM,
            Notification.NotificationCategory.MANUAL,
            Notification.NotificationPriority.MEDIUM,
            "Title",
            "Body",
            null,
            List.of(),
            null,  // deliveryChannel = null
            Notification.TargetType.ALL,
            null,
            null,
            null,
            null,
            Instant.now()
        );

        assertThat(notif.deliveryChannel()).isEqualTo("SSE");
    }

    @Test
    @DisplayName("Enums NotificationSource tiene todos los valores esperados")
    void notificationSourceEnum_hasExpectedValues() {
        assertThat(Notification.NotificationSource.values())
            .containsExactly(
                Notification.NotificationSource.SYSTEM,
                Notification.NotificationSource.USER,
                Notification.NotificationSource.INTEGRATION,
                Notification.NotificationSource.SCHEDULED_TASK
            );
    }

    @Test
    @DisplayName("Enums NotificationPriority tiene todos los valores esperados")
    void notificationPriorityEnum_hasExpectedValues() {
        assertThat(Notification.NotificationPriority.values())
            .containsExactly(
                Notification.NotificationPriority.LOW,
                Notification.NotificationPriority.MEDIUM,
                Notification.NotificationPriority.HIGH,
                Notification.NotificationPriority.CRITICAL
            );
    }

    @Test
    @DisplayName("Enums NotificationCategory tiene 23 valores")
    void notificationCategoryEnum_has23Categories() {
        assertThat(Notification.NotificationCategory.values()).hasSize(23);
    }
}
