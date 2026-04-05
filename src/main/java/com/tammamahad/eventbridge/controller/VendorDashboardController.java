package com.tammamahad.eventbridge.controller;

import com.tammamahad.eventbridge.entity.Booking;
import com.tammamahad.eventbridge.entity.BookingStatus;
import com.tammamahad.eventbridge.repo.BookingRepository;
import com.tammamahad.eventbridge.service.BookingStateService;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.List;

@RestController
@RequestMapping("/vendors/{vendorId}/bookings")
public class VendorDashboardController {

    private final BookingRepository bookingRepository;
    private final BookingStateService bookingStateService;

    public VendorDashboardController(BookingRepository bookingRepository, BookingStateService bookingStateService) {
        this.bookingRepository = bookingRepository;
        this.bookingStateService = bookingStateService;
    }

    // GET /vendors/1/bookings
    @GetMapping
    public List<Booking> all(@PathVariable Long vendorId) {
        return bookingStateService.normalizeAndSaveAll(bookingRepository.findByVendorId(vendorId));
    }

    // GET /vendors/1/bookings/requests
    @GetMapping("/requests")
    public List<Booking> requests(@PathVariable Long vendorId) {
        return bookingStateService.normalizeAndSaveAll(
                bookingRepository.findByVendorIdAndStatus(vendorId, BookingStatus.REQUESTED)
        );
    }

    // GET /vendors/1/bookings/approved
    @GetMapping("/approved")
    public List<Booking> approved(@PathVariable Long vendorId) {
        return bookingStateService.normalizeAndSaveAll(
                bookingRepository.findByVendorIdAndStatus(vendorId, BookingStatus.APPROVED)
        );
    }

    // GET /vendors/1/bookings/cancelled
    @GetMapping("/cancelled")
    public List<Booking> cancelled(@PathVariable Long vendorId) {
        return bookingStateService.normalizeAndSaveAll(
                bookingRepository.findByVendorIdAndStatus(vendorId, BookingStatus.CANCELLED)
        );
    }

    // GET /vendors/1/bookings/upcoming
    // Upcoming = confirmed bookings with eventDate >= today
    @GetMapping("/upcoming")
    public List<Booking> upcoming(@PathVariable Long vendorId) {
        LocalDate today = LocalDate.now();
        return bookingStateService.normalizeAndSaveAll(
                bookingRepository.findByVendorIdAndStatusAndEventDateGreaterThanEqual(
                        vendorId,
                        BookingStatus.CONFIRMED,
                        today
                )
        );
    }

    @GetMapping("/reserved")
    public List<Booking> reserved(@PathVariable Long vendorId) {
        return bookingStateService.normalizeAndSaveAll(
                bookingRepository.findByVendorIdAndStatusIn(
                        vendorId,
                        List.of(BookingStatus.APPROVED, BookingStatus.CONFIRMED)
                )
        );
    }
}
