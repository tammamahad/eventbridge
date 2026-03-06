package com.tammamahad.eventbridge.controller;

import com.tammamahad.eventbridge.entity.Booking;
import com.tammamahad.eventbridge.entity.BookingStatus;
import com.tammamahad.eventbridge.entity.Party;
import com.tammamahad.eventbridge.entity.Vendor;
import com.tammamahad.eventbridge.repo.BookingRepository;
import com.tammamahad.eventbridge.repo.PartyRepository;
import com.tammamahad.eventbridge.repo.VendorRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/bookings")
public class BookingController {

    private final BookingRepository bookingRepository;
    private final VendorRepository vendorRepository;
    private final PartyRepository partyRepository;

    public BookingController(
            BookingRepository bookingRepository,
            VendorRepository vendorRepository,
            PartyRepository partyRepository
    ) {
        this.bookingRepository = bookingRepository;
        this.vendorRepository = vendorRepository;
        this.partyRepository = partyRepository;
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
            return bookingRepository.findByVendorIdAndStatus(vendorId, status);
        }
        if (vendorId != null) {
            return bookingRepository.findByVendorId(vendorId);
        }
        return bookingRepository.findAll();
    }

    // GET /bookings/customer?email=test@example.com
    @GetMapping("/customer")
    public List<Booking> listForCustomer(@RequestParam String email) {
        String normalized = email == null ? "" : email.trim();
        if (normalized.isEmpty()) {
            throw new RuntimeException("Customer email is required.");
        }
        return bookingRepository.findByCustomerEmailIgnoreCaseOrderByEventDateDesc(normalized);
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

        return bookingRepository.save(booking);
    }

    // PATCH /bookings/1/confirm
    @PatchMapping("/{id}/confirm")
    public Booking confirm(@PathVariable Long id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found: " + id));

        booking.setStatus(BookingStatus.CONFIRMED);
        return bookingRepository.save(booking);
    }

    // PATCH /bookings/1/cancel
    @PatchMapping("/{id}/cancel")
    public Booking cancel(@PathVariable Long id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found: " + id));

        booking.setStatus(BookingStatus.CANCELLED);
        return bookingRepository.save(booking);
    }

    public static class CreateBookingRequest {
        public String eventDate;
        public String customerName;
        public String customerEmail;
        public String notes;
        public Long partyId;
    }
}
