package com.inventory.adapters.persistence.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Transient;
import org.springframework.data.domain.Persistable;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.Instant;
import java.time.LocalTime;
import java.util.UUID;

@Table("notification_schedules")
public class NotificationSchedulesEntity implements Persistable<UUID> {

    @Id
    private UUID id;

    @Column("user_id")
    private UUID userId;

    @Column("quiet_hours_start")
    private LocalTime quietHoursStart;

    @Column("quiet_hours_end")
    private LocalTime quietHoursEnd;

    @Column("quiet_hours_enabled")
    private Boolean quietHoursEnabled;

    @Column("quiet_days_list")
    private Integer[] quietDaysList;

    @Column("bypass_on_critical")
    private Boolean bypassOnCritical;

    @Column("created_at")
    private Instant createdAt;

    @Column("updated_at")
    private Instant updatedAt;

    @Transient
    private boolean isNew = true;

    public NotificationSchedulesEntity() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public LocalTime getQuietHoursStart() { return quietHoursStart; }
    public void setQuietHoursStart(LocalTime quietHoursStart) { this.quietHoursStart = quietHoursStart; }

    public LocalTime getQuietHoursEnd() { return quietHoursEnd; }
    public void setQuietHoursEnd(LocalTime quietHoursEnd) { this.quietHoursEnd = quietHoursEnd; }

    public Boolean getQuietHoursEnabled() { return quietHoursEnabled; }
    public void setQuietHoursEnabled(Boolean quietHoursEnabled) { this.quietHoursEnabled = quietHoursEnabled; }

    public Integer[] getQuietDaysList() { return quietDaysList; }
    public void setQuietDaysList(Integer[] quietDaysList) { this.quietDaysList = quietDaysList; }

    public Boolean getBypassOnCritical() { return bypassOnCritical; }
    public void setBypassOnCritical(Boolean bypassOnCritical) { this.bypassOnCritical = bypassOnCritical; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    @Override
    public boolean isNew() { return isNew; }
    public void setNew(boolean isNew) { this.isNew = isNew; }
}
