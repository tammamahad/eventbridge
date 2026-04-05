package com.tammamahad.eventbridge.controller;

import com.tammamahad.eventbridge.entity.Booking;
import com.tammamahad.eventbridge.entity.BookingStatus;
import com.tammamahad.eventbridge.repo.BookingRepository;
import com.tammamahad.eventbridge.service.BookingStateService;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.*;

@RestController
@RequestMapping("/vendors/{vendorId}")
public class VendorAnalyticsController {

    private final BookingRepository bookingRepository;
    private final BookingStateService bookingStateService;

    public VendorAnalyticsController(BookingRepository bookingRepository, BookingStateService bookingStateService) {
        this.bookingRepository = bookingRepository;
        this.bookingStateService = bookingStateService;
    }

    @GetMapping("/analytics")
    public VendorAnalyticsResponse analytics(@PathVariable Long vendorId) {
        List<Booking> bookings = bookingStateService.normalizeAndSaveAll(bookingRepository.findByVendorId(vendorId));
        LocalDate today = LocalDate.now();

        long total = bookings.size();
        long requested = bookings.stream().filter(b -> b.getStatus() == BookingStatus.REQUESTED).count();
        long approved = bookings.stream().filter(b -> b.getStatus() == BookingStatus.APPROVED).count();
        long confirmed = bookings.stream().filter(b -> b.getStatus() == BookingStatus.CONFIRMED).count();
        long cancelled = bookings.stream().filter(b -> b.getStatus() == BookingStatus.CANCELLED).count();
        long upcoming = bookings.stream()
                .filter(b -> b.getStatus() == BookingStatus.CONFIRMED)
                .filter(b -> !b.getEventDate().isBefore(today))
                .count();

        double conversionRate = total == 0 ? 0.0 : (confirmed * 100.0) / total;

        YearMonth current = YearMonth.now();
        List<MonthlyPoint> monthly = new ArrayList<>();
        for (int i = 5; i >= 0; i -= 1) {
            YearMonth ym = current.minusMonths(i);
            long monthTotal = bookings.stream().filter(b -> YearMonth.from(b.getEventDate()).equals(ym)).count();
            long monthConfirmed = bookings.stream()
                    .filter(b -> YearMonth.from(b.getEventDate()).equals(ym))
                    .filter(b -> b.getStatus() == BookingStatus.CONFIRMED)
                    .count();
            long monthCancelled = bookings.stream()
                    .filter(b -> YearMonth.from(b.getEventDate()).equals(ym))
                    .filter(b -> b.getStatus() == BookingStatus.CANCELLED)
                    .count();
            monthly.add(new MonthlyPoint(ym.toString(), monthTotal, monthConfirmed, monthCancelled));
        }

        return new VendorAnalyticsResponse(
                total,
                requested,
                approved,
                confirmed,
                cancelled,
                upcoming,
                Math.round(conversionRate * 10.0) / 10.0,
                monthly
        );
    }

    public record VendorAnalyticsResponse(
            long totalBookings,
            long requestedBookings,
            long approvedBookings,
            long confirmedBookings,
            long cancelledBookings,
            long upcomingBookings,
            double conversionRate,
            List<MonthlyPoint> monthlyTrend
    ) {
    }

    public record MonthlyPoint(String month, long total, long confirmed, long cancelled) {
    }
}
