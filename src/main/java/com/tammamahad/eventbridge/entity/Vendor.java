package com.tammamahad.eventbridge.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "vendors")
public class Vendor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String businessName;

    @Column(nullable = false)
    private String category;

    @Column(nullable = false)
    private String city;

    private String phone;
    private String email;
    private String shortDescription;
    private String address;
    private Double latitude;
    private Double longitude;
    private Integer startingPrice;
    private String pricingType;
    private String priceNote;

    public Vendor() {
    }

    public Vendor(String businessName, String category, String city, String phone, String email) {
        this.businessName = businessName;
        this.category = category;
        this.city = city;
        this.phone = phone;
        this.email = email;
    }

    // GETTERS
    public Long getId() {
        return id;
    }

    public String getBusinessName() {
        return businessName;
    }

    public String getCategory() {
        return category;
    }

    public String getCity() {
        return city;
    }

    public String getPhone() {
        return phone;
    }

    public String getEmail() {
        return email;
    }

    public String getShortDescription() {
        return shortDescription;
    }

    public String getAddress() {
        return address;
    }

    public Double getLatitude() {
        return latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public Integer getStartingPrice() {
        return startingPrice;
    }

    public String getPricingType() {
        return pricingType;
    }

    public String getPriceNote() {
        return priceNote;
    }

    // SETTERS
    public void setId(Long id) {
        this.id = id;
    }

    public void setBusinessName(String businessName) {
        this.businessName = businessName;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public void setShortDescription(String shortDescription) {
        this.shortDescription = shortDescription;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public void setStartingPrice(Integer startingPrice) {
        this.startingPrice = startingPrice;
    }

    public void setPricingType(String pricingType) {
        this.pricingType = pricingType;
    }

    public void setPriceNote(String priceNote) {
        this.priceNote = priceNote;
    }
}
