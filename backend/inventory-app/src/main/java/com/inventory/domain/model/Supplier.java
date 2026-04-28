package com.inventory.domain.model;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

/**
 * Entidad de dominio: Proveedor.
 * Representa un tercero que suministra productos.
 */
public class Supplier {
    private final UUID id;
    private final String code;
    private final String name;
    private final String contactName;
    private final String phone;
    private final String email;
    private final String address;
    private final String notes;
    private final boolean active;
    private final Instant createdAt;
    private final Instant updatedAt;
    private final int version;
    private final String website;
    private final List<SupplierImage> images;
    private final List<SupplierSocialLink> socialLinks;
    private final List<SupplierCatalogProduct> catalogProducts;

    public Supplier(UUID id, String code, String name, String contactName, String phone,
                    String email, String address, String notes, boolean active,
                    Instant createdAt, Instant updatedAt, int version,
                    String website, List<SupplierImage> images,
                    List<SupplierSocialLink> socialLinks,
                    List<SupplierCatalogProduct> catalogProducts) {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Supplier name cannot be null or blank");
        }
        this.id = id != null ? id : UUID.randomUUID();
        this.code = code;
        this.name = name.trim();
        this.contactName = contactName;
        this.phone = phone;
        this.email = email;
        this.address = address;
        this.notes = notes;
        this.active = active;
        this.createdAt = createdAt != null ? createdAt : Instant.now();
        this.updatedAt = updatedAt != null ? updatedAt : this.createdAt;
        this.version = version;
        this.website = website;
        this.images = images != null ? Collections.unmodifiableList(images) : Collections.emptyList();
        this.socialLinks = socialLinks != null ? Collections.unmodifiableList(socialLinks) : Collections.emptyList();
        this.catalogProducts = catalogProducts != null ? Collections.unmodifiableList(catalogProducts) : Collections.emptyList();
    }

    public static Supplier create(String code, String name, String contactName, String phone, String email) {
        return new Supplier(
            UUID.randomUUID(),
            code,
            name,
            contactName,
            phone,
            email,
            null,
            null,
            true,
            Instant.now(),
            Instant.now(),
            0,
            null, null, null, null
        );
    }

    // Getters
    public UUID getId() { return id; }
    public String getCode() { return code; }
    public String getName() { return name; }
    public String getContactName() { return contactName; }
    public String getPhone() { return phone; }
    public String getEmail() { return email; }
    public String getAddress() { return address; }
    public String getNotes() { return notes; }
    public boolean isActive() { return active; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public int getVersion() { return version; }
    public String getWebsite() { return website; }
    public List<SupplierImage> getImages() { return images; }
    public List<SupplierSocialLink> getSocialLinks() { return socialLinks; }
    public List<SupplierCatalogProduct> getCatalogProducts() { return catalogProducts; }

    public Supplier update(String code, String name, String contactName, String phone, 
                           String email, String address, String notes, String website) {
        return new Supplier(
            this.id,
            code != null ? code : this.code,
            name != null ? name : this.name,
            contactName,
            phone,
            email,
            address,
            notes,
            this.active,
            this.createdAt,
            Instant.now(),
            this.version,
            website,
            this.images,
            this.socialLinks,
            this.catalogProducts
        );
    }

    public Supplier deactivate() {
        return new Supplier(id, code, name, contactName, phone, email, address, notes, 
                           false, createdAt, Instant.now(), version,
                           website, images, socialLinks, catalogProducts);
    }

    public Supplier activate() {
        return new Supplier(id, code, name, contactName, phone, email, address, notes, 
                           true, createdAt, Instant.now(), version,
                           website, images, socialLinks, catalogProducts);
    }

    public Supplier withVersion(int newVersion) {
        return new Supplier(id, code, name, contactName, phone, email, address, notes, 
                           active, createdAt, updatedAt, newVersion,
                           website, images, socialLinks, catalogProducts);
    }
}
