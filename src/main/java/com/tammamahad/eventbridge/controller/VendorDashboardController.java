package com.tammamahad.eventbridge.controller;

import com.tammamahad.eventbridge.entity.Booking;
import com.tammamahad.eventbridge.entity.BookingStatus;
import com.tammamahad.eventbridge.repo.BookingRepository;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/vendors/{vendorId}/bookings")
public class VendorDashboardController {

    private final BookingRepository bookingRepository;

    public VendorDashboardController(BookingRepository bookingRepository) {
        this.bookingRepository = bookingRepository;
    }

    // GET /vendors/1/bookings
    @GetMapping
    public List<Booking> all(@PathVariable Long vendorId) {
        return bookingRepository.findByVendorId(vendorId);
    }

    // GET /vendors/1/bookings/requests
    @GetMapping("/requests")
    public List<Booking> requests(@PathVariable Long vendorId) {
        return bookingRepository.findByVendorIdAndStatus(vendorId, BookingStatus.REQUESTED);
    }

    // GET /vendors/1/bookings/confirmed
    @GetMapping("/confirmed")
    public List<Booking> confirmed(@PathVariable Long vendorId) {
        return bookingRepository.findByVendorIdAndStatus(vendorId, BookingStatus.CONFIRMED);
    }

    // GET /vendors/1/bookings/cancelled
    @GetMapping("/cancelled")
    public List<Booking> cancelled(@PathVariable Long vendorId) {
        return bookingRepository.findByVendorIdAndStatus(vendorId, BookingStatus.CANCELLED);
    }

    // GET /vendors/1/bookings/upcoming
    // Upcoming = confirmed bookings with eventDate >= today
    @GetMapping("/upcoming")
    public List<Booking> upcoming(@PathVariable Long vendorId) {
        LocalDate today = LocalDate.now();
        return bookingRepository.findByVendorIdAndStatusAndEventDateGreaterThanEqual(
                vendorId,
                BookingStatus.CONFIRMED,
                today
        );
    }
}
