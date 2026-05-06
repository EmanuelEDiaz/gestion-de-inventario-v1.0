package com.inventory.adapters.persistence.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Transient;
import org.springframework.data.domain.Persistable;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.Instant;
import java.util.UUID;

@Table("notifications")
public class NotificationEntity implements Persistable<UUID> {

    @Id
    private UUID id;

    @Column("source")
    private String source;

    @Column("category")
    private String category;

    @Column("priority")
    private String priority;

    @Column("title")
    private String title;

    @Column("body")
    private String body;

    @Column("action_url")
    private String actionUrl;

    @Column("tags")
    private String[] tags;

    @Column("delivery_channel")
    private String deliveryChannel;

    @Column("target_type")
    private String targetType;

    @Column("target_user_id")
    private UUID targetUserId;

    @Column("created_by")
    private UUID createdBy;

    @Column("entity_type")
    private String entityType;

    @Column("entity_id")
    private UUID entityId;

    @Column("created_at")
    private Instant createdAt;

    @Transient
    private boolean isNew = true;

    public NotificationEntity() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getBody() { return body; }
    public void setBody(String body) { this.body = body; }

    public String getActionUrl() { return actionUrl; }
    public void setActionUrl(String actionUrl) { this.actionUrl = actionUrl; }

    public String[] getTags() { return tags; }
    public void setTags(String[] tags) { this.tags = tags; }

    public String getDeliveryChannel() { return deliveryChannel; }
    public void setDeliveryChannel(String deliveryChannel) { this.deliveryChannel = deliveryChannel; }

    public String getTargetType() { return targetType; }
    public void setTargetType(String targetType) { this.targetType = targetType; }

    public UUID getTargetUserId() { return targetUserId; }
    public void setTargetUserId(UUID targetUserId) { this.targetUserId = targetUserId; }

    public UUID getCreatedBy() { return createdBy; }
    public void setCreatedBy(UUID createdBy) { this.createdBy = createdBy; }

    public String getEntityType() { return entityType; }
    public void setEntityType(String entityType) { this.entityType = entityType; }

    public UUID getEntityId() { return entityId; }
    public void setEntityId(UUID entityId) { this.entityId = entityId; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    @Override
    public boolean isNew() { return isNew; }
    public void setNew(boolean isNew) { this.isNew = isNew; }
}
