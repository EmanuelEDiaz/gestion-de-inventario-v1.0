package com.inventory.domain.model.supplier;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

public class Supplier {
    private final UUID id;
    private final String code;
    private final String name;
    private final String contactName;
    private final String phone;
    private final String email;
    private final String address;
    private final String province;
    private final String municipality;
    private final String street;
    private final String locality;
    private final String zipCode;
    private final BigDecimal latitude;
    private final BigDecimal longitude;
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
                    String website,
                    String province, String municipality, String street, String locality, String zipCode,
                    BigDecimal latitude, BigDecimal longitude,
                    List<SupplierImage> images,
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
        this.province = province;
        this.municipality = municipality;
        this.street = street;
        this.locality = locality;
        this.zipCode = zipCode;
        this.latitude = latitude;
        this.longitude = longitude;
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

    public static Supplier create(String code, String name, String contactName, String phone, String email,
                                  String province, String municipality, String street, String locality, String zipCode,
                                  BigDecimal latitude, BigDecimal longitude) {
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
            null,
            province,
            municipality,
            street,
            locality,
            zipCode,
            latitude,
            longitude,
            null, null, null
        );
    }

    public UUID getId() { return id; }
    public String getCode() { return code; }
    public String getName() { return name; }
    public String getContactName() { return contactName; }
    public String getPhone() { return phone; }
    public String getEmail() { return email; }
    public String getAddress() { return address; }
    public String getProvince() { return province; }
    public String getMunicipality() { return municipality; }
    public String getStreet() { return street; }
    public String getLocality() { return locality; }
    public String getZipCode() { return zipCode; }
    public BigDecimal getLatitude() { return latitude; }
    public BigDecimal getLongitude() { return longitude; }
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
                           String email, String address, String notes, String website,
                           String province, String municipality, String street, String locality, String zipCode,
                           BigDecimal latitude, BigDecimal longitude) {
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
            province,
            municipality,
            street,
            locality,
            zipCode,
            latitude,
            longitude,
            this.images,
            this.socialLinks,
            this.catalogProducts
        );
    }

    public Supplier deactivate() {
        return new Supplier(id, code, name, contactName, phone, email, address, notes,
                           false, createdAt, Instant.now(), version,
                           website, province, municipality, street, locality, zipCode, latitude, longitude,
                           images, socialLinks, catalogProducts);
    }

    public Supplier activate() {
        return new Supplier(id, code, name, contactName, phone, email, address, notes,
                           true, createdAt, Instant.now(), version,
                           website, province, municipality, street, locality, zipCode, latitude, longitude,
                           images, socialLinks, catalogProducts);
    }

    public Supplier withVersion(int newVersion) {
        return new Supplier(id, code, name, contactName, phone, email, address, notes,
                           active, createdAt, updatedAt, newVersion,
                           website, province, municipality, street, locality, zipCode, latitude, longitude,
                           images, socialLinks, catalogProducts);
    }
}
