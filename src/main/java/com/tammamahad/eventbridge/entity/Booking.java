package com.tammamahad.eventbridge.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(
        name = "bookings",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_vendor_date", columnNames = {"vendor_id", "event_date"})
        }
)
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Many bookings can belong to one vendor
    @ManyToOne(optional = false)
    @JoinColumn(name = "vendor_id", nullable = false)
    private Vendor vendor;

    @ManyToOne
    @JoinColumn(name = "party_id")
    private Party party;

    @Column(name = "event_date", nullable = false)
    private LocalDate eventDate;

    @Column(nullable = false)
    private String customerName;

    private String customerEmail;
    private String notes;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BookingStatus status = BookingStatus.REQUESTED;

    public Booking() {}

    public Booking(Vendor vendor, LocalDate eventDate, String customerName, String customerEmail, String notes) {
        this.vendor = vendor;
        this.eventDate = eventDate;
        this.customerName = customerName;
        this.customerEmail = customerEmail;
        this.notes = notes;
        this.status = BookingStatus.REQUESTED;
    }

    public Long getId() { return id; }
    public Vendor getVendor() { return vendor; }
    public Party getParty() { return party; }
    public LocalDate getEventDate() { return eventDate; }
    public String getCustomerName() { return customerName; }
    public String getCustomerEmail() { return customerEmail; }
    public String getNotes() { return notes; }
    public BookingStatus getStatus() { return status; }

    public void setId(Long id) { this.id = id; }
    public void setVendor(Vendor vendor) { this.vendor = vendor; }
    public void setParty(Party party) { this.party = party; }
    public void setEventDate(LocalDate eventDate) { this.eventDate = eventDate; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }
    public void setCustomerEmail(String customerEmail) { this.customerEmail = customerEmail; }
    public void setNotes(String notes) { this.notes = notes; }
    public void setStatus(BookingStatus status) { this.status = status; }
}
