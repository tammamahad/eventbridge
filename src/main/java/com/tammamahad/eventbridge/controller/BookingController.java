package com.tammamahad.eventbridge.controller;

import com.tammamahad.eventbridge.entity.Booking;
import com.tammamahad.eventbridge.entity.BookingStatus;
import com.tammamahad.eventbridge.entity.PaymentStatus;
import com.tammamahad.eventbridge.entity.Party;
import com.tammamahad.eventbridge.entity.Vendor;
import com.tammamahad.eventbridge.repo.BookingRepository;
import com.tammamahad.eventbridge.repo.PartyRepository;
import com.tammamahad.eventbridge.repo.VendorRepository;
import com.tammamahad.eventbridge.service.BookingStateService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/bookings")
public class BookingController {

    private final BookingRepository bookingRepository;
    private final VendorRepository vendorRepository;
    private final PartyRepository partyRepository;
    private final BookingStateService bookingStateService;

    public BookingController(
            BookingRepository bookingRepository,
            VendorRepository vendorRepository,
            PartyRepository partyRepository,
            BookingStateService bookingStateService
    ) {
        this.bookingRepository = bookingRepository;
        this.vendorRepository = vendorRepository;
        this.partyRepository = partyRepository;
        this.bookingStateService = bookingStateService;
    }

    // GET /bookings
    // GET /bookings?vendorId=1
    // GET /bookings?vendorId=1&status=CONFIRMED
    @GetMapping
    public List<Booking> list(
            @RequestParam(required = false) Long vendorId,
            @RequestParam(required = false) BookingStatus status
    ) {
        if (vendorId != null && status != null) {
            return bookingStateService.normalizeAndSaveAll(bookingRepository.findByVendorIdAndStatus(vendorId, status));
        }
        if (vendorId != null) {
            return bookingStateService.normalizeAndSaveAll(bookingRepository.findByVendorId(vendorId));
        }
        return bookingStateService.normalizeAndSaveAll(bookingRepository.findAll());
    }

    // GET /bookings/customer?email=test@example.com
    @GetMapping("/customer")
    public List<Booking> listForCustomer(@RequestParam String email) {
        String normalized = email == null ? "" : email.trim();
        if (normalized.isEmpty()) {
            throw new RuntimeException("Customer email is required.");
        }
        return bookingStateService.normalizeAndSaveAll(
                bookingRepository.findByCustomerEmailIgnoreCaseOrderByEventDateDesc(normalized)
        );
    }

    // POST /bookings?vendorId=1
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Booking create(@RequestParam Long vendorId, @RequestBody CreateBookingRequest req) {

        Vendor vendor = vendorRepository.findById(vendorId)
                .orElseThrow(() -> new RuntimeException("Vendor not found: " + vendorId));

        LocalDate date = LocalDate.parse(req.eventDate);

        if (bookingRepository.existsByVendorIdAndEventDate(vendorId, date)) {
            throw new RuntimeException("Vendor already booked on " + date);
        }

        Party party = null;
        if (req.partyId != null) {
            party = partyRepository.findById(req.partyId)
                    .orElseThrow(() -> new RuntimeException("Party not found: " + req.partyId));

            String bookingEmail = req.customerEmail == null ? "" : req.customerEmail.trim();
            String partyEmail = party.getCustomerEmail() == null ? "" : party.getCustomerEmail().trim();
            if (!partyEmail.equalsIgnoreCase(bookingEmail)) {
                throw new RuntimeException("Selected party does not belong to this customer.");
            }

            if (!party.getEventDate().equals(date)) {
                throw new RuntimeException("Booking date must match the selected party date.");
            }
        }

        Booking booking = new Booking();
        booking.setVendor(vendor);
        booking.setParty(party);
        booking.setEventDate(date);
        booking.setCustomerName(req.customerName);
        booking.setCustomerEmail(req.customerEmail);
        booking.setNotes(req.notes);
        booking.setStatus(BookingStatus.REQUESTED);
        booking.setPaymentStatus(PaymentStatus.NOT_READY);
        booking.setPaymentAmount(vendor.getStartingPrice());

        return bookingStateService.normalizeAndPersist(booking);
    }

    // PATCH /bookings/1/confirm
    @PatchMapping("/{id}/confirm")
    public Booking confirm(@PathVariable Long id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found: " + id));

        booking.setStatus(BookingStatus.APPROVED);
        booking.setPaymentStatus(PaymentStatus.UNPAID);
        if (booking.getPaymentAmount() == null && booking.getVendor() != null) {
            booking.setPaymentAmount(booking.getVendor().getStartingPrice());
        }
        return bookingStateService.normalizeAndPersist(booking);
    }

    // PATCH /bookings/1/cancel
    @PatchMapping("/{id}/cancel")
    public Booking cancel(@PathVariable Long id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found: " + id));

        booking.setStatus(BookingStatus.CANCELLED);
        if (booking.getPaymentStatus() != PaymentStatus.PAID) {
            booking.setPaymentStatus(PaymentStatus.NOT_READY);
        }
        return bookingStateService.normalizeAndPersist(booking);
    }

    // PATCH /bookings/1/pay
    @PatchMapping("/{id}/pay")
    public Booking pay(@PathVariable Long id, @RequestBody MockPaymentRequest req) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found: " + id));

        if (booking.getStatus() != BookingStatus.APPROVED && booking.getStatus() != BookingStatus.CONFIRMED) {
            throw new RuntimeException("Only approved bookings can be paid.");
        }
        if (booking.getPaymentStatus() == PaymentStatus.PAID) {
            throw new RuntimeException("Booking is already paid.");
        }

        String cardholderName = req.cardholderName == null ? "" : req.cardholderName.trim();
        String cardNumber = req.cardNumber == null ? "" : req.cardNumber.replaceAll("\\s+", "");

        if (cardholderName.isEmpty()) {
            throw new RuntimeException("Cardholder name is required.");
        }
        if (!cardNumber.matches("\\d{16}")) {
            throw new RuntimeException("Mock card number must be 16 digits.");
        }

        String last4 = cardNumber.substring(cardNumber.length() - 4);
        int amount = booking.getPaymentAmount() != null
                ? booking.getPaymentAmount()
                : (booking.getVendor() != null && booking.getVendor().getStartingPrice() != null
                    ? booking.getVendor().getStartingPrice()
                    : 0);

        booking.setPaymentAmount(amount);
        booking.setStatus(BookingStatus.CONFIRMED);
        booking.setPaymentStatus(PaymentStatus.PAID);
        booking.setPaymentMethodLabel("Mock Visa ending in " + last4);
        booking.setPaidAt(LocalDateTime.now());
        return bookingStateService.normalizeAndPersist(booking);
    }

    public static class CreateBookingRequest {
        public String eventDate;
        public String customerName;
        public String customerEmail;
        public String notes;
        public Long partyId;
    }

    public static class MockPaymentRequest {
        public String cardholderName;
        public String cardNumber;
    }
}
