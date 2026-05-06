package com.inventory.adapters.persistence.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Transient;
import org.springframework.data.domain.Persistable;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.Instant;
import java.util.UUID;

@Table("notification_preferences")
public class NotificationPreferencesEntity implements Persistable<UUID> {

    @Id
    private UUID id;

    @Column("user_id")
    private UUID userId;

    @Column("enabled")
    private Boolean enabled;

    @Column("low_stock_enabled")
    private Boolean lowStockEnabled;

    @Column("sync_enabled")
    private Boolean syncEnabled;

    @Column("operations_enabled")
    private Boolean operationsEnabled;

    @Column("debt_enabled")
    private Boolean debtEnabled;

    @Column("user_actions_enabled")
    private Boolean userActionsEnabled;

    @Column("system_enabled")
    private Boolean systemEnabled;

    @Column("push_notifications_enabled")
    private Boolean pushNotificationsEnabled;

    @Column("toast_notifications_enabled")
    private Boolean toastNotificationsEnabled;

    @Column("sse_enabled")
    private Boolean sseEnabled;

    @Column("sound_enabled")
    private Boolean soundEnabled;

    @Column("desktop_notification_enabled")
    private Boolean desktopNotificationEnabled;

    @Column("created_at")
    private Instant createdAt;

    @Column("updated_at")
    private Instant updatedAt;

    @Transient
    private boolean isNew = true;

    public NotificationPreferencesEntity() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public Boolean getEnabled() { return enabled; }
    public void setEnabled(Boolean enabled) { this.enabled = enabled; }

    public Boolean getLowStockEnabled() { return lowStockEnabled; }
    public void setLowStockEnabled(Boolean lowStockEnabled) { this.lowStockEnabled = lowStockEnabled; }

    public Boolean getSyncEnabled() { return syncEnabled; }
    public void setSyncEnabled(Boolean syncEnabled) { this.syncEnabled = syncEnabled; }

    public Boolean getOperationsEnabled() { return operationsEnabled; }
    public void setOperationsEnabled(Boolean operationsEnabled) { this.operationsEnabled = operationsEnabled; }

    public Boolean getDebtEnabled() { return debtEnabled; }
    public void setDebtEnabled(Boolean debtEnabled) { this.debtEnabled = debtEnabled; }

    public Boolean getUserActionsEnabled() { return userActionsEnabled; }
    public void setUserActionsEnabled(Boolean userActionsEnabled) { this.userActionsEnabled = userActionsEnabled; }

    public Boolean getSystemEnabled() { return systemEnabled; }
    public void setSystemEnabled(Boolean systemEnabled) { this.systemEnabled = systemEnabled; }

    public Boolean getPushNotificationsEnabled() { return pushNotificationsEnabled; }
    public void setPushNotificationsEnabled(Boolean pushNotificationsEnabled) { this.pushNotificationsEnabled = pushNotificationsEnabled; }

    public Boolean getToastNotificationsEnabled() { return toastNotificationsEnabled; }
    public void setToastNotificationsEnabled(Boolean toastNotificationsEnabled) { this.toastNotificationsEnabled = toastNotificationsEnabled; }

    public Boolean getSseEnabled() { return sseEnabled; }
    public void setSseEnabled(Boolean sseEnabled) { this.sseEnabled = sseEnabled; }

    public Boolean getSoundEnabled() { return soundEnabled; }
    public void setSoundEnabled(Boolean soundEnabled) { this.soundEnabled = soundEnabled; }

    public Boolean getDesktopNotificationEnabled() { return desktopNotificationEnabled; }
    public void setDesktopNotificationEnabled(Boolean desktopNotificationEnabled) { this.desktopNotificationEnabled = desktopNotificationEnabled; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    @Override
    public boolean isNew() { return isNew; }
    public void setNew(boolean isNew) { this.isNew = isNew; }
}
