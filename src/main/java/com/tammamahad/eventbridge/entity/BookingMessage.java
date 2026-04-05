package com.tammamahad.eventbridge.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "booking_messages")
public class BookingMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "booking_id", nullable = false)
    @JsonIgnore
    private Booking booking;

    @Column(nullable = false)
    private String senderRole;

    @Column(nullable = false)
    private String senderName;

    @Column(nullable = false, length = 1200)
    private String body;

    private String attachmentName;
    private String attachmentContentType;
    private Long attachmentSizeBytes;

    @Column(columnDefinition = "TEXT")
    private String attachmentDataBase64;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    public Long getId() {
        return id;
    }

    public Booking getBooking() {
        return booking;
    }

    public String getSenderRole() {
        return senderRole;
    }

    public String getSenderName() {
        return senderName;
    }

    public String getBody() {
        return body;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public String getAttachmentName() {
        return attachmentName;
    }

    public String getAttachmentContentType() {
        return attachmentContentType;
    }

    public Long getAttachmentSizeBytes() {
        return attachmentSizeBytes;
    }

    public String getAttachmentDataBase64() {
        return attachmentDataBase64;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setBooking(Booking booking) {
        this.booking = booking;
    }

    public void setSenderRole(String senderRole) {
        this.senderRole = senderRole;
    }

    public void setSenderName(String senderName) {
        this.senderName = senderName;
    }

    public void setBody(String body) {
        this.body = body;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public void setAttachmentName(String attachmentName) {
        this.attachmentName = attachmentName;
    }

    public void setAttachmentContentType(String attachmentContentType) {
        this.attachmentContentType = attachmentContentType;
    }

    public void setAttachmentSizeBytes(Long attachmentSizeBytes) {
        this.attachmentSizeBytes = attachmentSizeBytes;
    }

    public void setAttachmentDataBase64(String attachmentDataBase64) {
        this.attachmentDataBase64 = attachmentDataBase64;
    }
}
