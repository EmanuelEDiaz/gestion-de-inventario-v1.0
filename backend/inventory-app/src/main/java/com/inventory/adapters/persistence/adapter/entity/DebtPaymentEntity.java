package com.inventory.adapters.persistence.adapter.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Transient;
import org.springframework.data.domain.Persistable;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Table("debt_payments")
public class DebtPaymentEntity implements Persistable<UUID> {

    @Id
    private UUID id;

    @Column("debt_id")
    private UUID debtId;

    @Column("amount")
    private BigDecimal amount;

    @Column("payment_method")
    private String paymentMethod;

    @Column("notes")
    private String notes;

    @Column("registered_by")
    private UUID registeredBy;

    @Column("created_at")
    private Instant createdAt;

    @Transient
    private boolean isNew = true;

    public DebtPaymentEntity() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getDebtId() { return debtId; }
    public void setDebtId(UUID debtId) { this.debtId = debtId; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public UUID getRegisteredBy() { return registeredBy; }
    public void setRegisteredBy(UUID registeredBy) { this.registeredBy = registeredBy; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    @Override
    public boolean isNew() { return isNew; }
    public void setNew(boolean isNew) { this.isNew = isNew; }
}
