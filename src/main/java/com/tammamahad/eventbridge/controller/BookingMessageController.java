package com.tammamahad.eventbridge.controller;

import com.tammamahad.eventbridge.entity.Booking;
import com.tammamahad.eventbridge.entity.BookingMessage;
import com.tammamahad.eventbridge.repo.BookingMessageRepository;
import com.tammamahad.eventbridge.repo.BookingRepository;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/bookings/{bookingId}/messages")
public class BookingMessageController {

    private final BookingRepository bookingRepository;
    private final BookingMessageRepository bookingMessageRepository;

    public BookingMessageController(
            BookingRepository bookingRepository,
            BookingMessageRepository bookingMessageRepository
    ) {
        this.bookingRepository = bookingRepository;
        this.bookingMessageRepository = bookingMessageRepository;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public List<MessageResponse> list(@PathVariable Long bookingId) {
        bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found: " + bookingId));
        return bookingMessageRepository.findByBookingIdOrderByCreatedAtAsc(bookingId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public MessageResponse create(@PathVariable Long bookingId, @RequestBody CreateMessageRequest req) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found: " + bookingId));

        String body = req.body == null ? "" : req.body.trim();
        if (body.length() > 1000) throw new RuntimeException("Message must be <= 1000 characters.");

        String senderRole = req.senderRole == null ? "" : req.senderRole.trim().toUpperCase();
        if (!senderRole.equals("CUSTOMER") && !senderRole.equals("VENDOR")) {
            throw new RuntimeException("senderRole must be CUSTOMER or VENDOR.");
        }

        String senderName = req.senderName == null ? "" : req.senderName.trim();
        if (senderName.isEmpty()) senderName = senderRole.equals("VENDOR") ? "Vendor" : "Customer";

        BookingMessage message = new BookingMessage();
        message.setBooking(booking);
        message.setSenderRole(senderRole);
        message.setSenderName(senderName);
        message.setBody(body);
        boolean hasAttachment = false;
        if (req.attachment != null) {
            String contentType = req.attachment.contentType == null ? "" : req.attachment.contentType.trim().toLowerCase();
            boolean allowed = contentType.startsWith("image/") || contentType.equals("application/pdf");
            if (!allowed) {
                throw new RuntimeException("Attachment type must be an image or PDF.");
            }

            long sizeBytes = req.attachment.sizeBytes == null ? 0L : req.attachment.sizeBytes;
            if (sizeBytes <= 0 || sizeBytes > 10L * 1024L * 1024L) {
                throw new RuntimeException("Attachment size must be between 1 byte and 10MB.");
            }

            String base64 = req.attachment.base64Data == null ? "" : req.attachment.base64Data.trim();
            if (base64.isEmpty()) {
                throw new RuntimeException("Attachment data is missing.");
            }

            String attachmentName = req.attachment.fileName == null ? "" : req.attachment.fileName.trim();
            message.setAttachmentName(attachmentName.isEmpty() ? "attachment" : attachmentName);
            message.setAttachmentContentType(contentType);
            message.setAttachmentSizeBytes(sizeBytes);
            message.setAttachmentDataBase64(base64);
            hasAttachment = true;
        }
        if (body.isEmpty() && !hasAttachment) throw new RuntimeException("Message body is required.");
        message.setCreatedAt(LocalDateTime.now());
        return toResponse(bookingMessageRepository.save(message));
    }

    private MessageResponse toResponse(BookingMessage m) {
        return new MessageResponse(
                m.getId(),
                m.getSenderRole(),
                m.getSenderName(),
                m.getBody(),
                m.getCreatedAt(),
                m.getAttachmentName(),
                m.getAttachmentContentType(),
                m.getAttachmentSizeBytes(),
                m.getAttachmentDataBase64()
        );
    }

    public static class CreateMessageRequest {
        public String senderRole;
        public String senderName;
        public String body;
        public Attachment attachment;
    }

    public static class Attachment {
        public String fileName;
        public String contentType;
        public Long sizeBytes;
        public String base64Data;
    }

    public record MessageResponse(
            Long id,
            String senderRole,
            String senderName,
            String body,
            LocalDateTime createdAt,
            String attachmentName,
            String attachmentContentType,
            Long attachmentSizeBytes,
            String attachmentDataBase64
    ) {
    }
}
