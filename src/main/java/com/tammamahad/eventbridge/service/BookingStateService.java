package com.tammamahad.eventbridge.service;

import com.tammamahad.eventbridge.entity.Booking;
import com.tammamahad.eventbridge.entity.BookingStatus;
import com.tammamahad.eventbridge.entity.PaymentStatus;
import com.tammamahad.eventbridge.repo.BookingRepository;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class BookingStateService {

    private final BookingRepository bookingRepository;

    public BookingStateService(BookingRepository bookingRepository) {
        this.bookingRepository = bookingRepository;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void repairExistingBookingStates() {
        List<Booking> bookings = bookingRepository.findAll();
        List<Booking> changed = new ArrayList<>();

        for (Booking booking : bookings) {
            if (normalize(booking)) {
                changed.add(booking);
            }
        }

        if (!changed.isEmpty()) {
            bookingRepository.saveAll(changed);
        }
    }

    public Booking normalizeAndPersist(Booking booking) {
        normalize(booking);
        return bookingRepository.save(booking);
    }

    public List<Booking> normalizeAndSaveAll(List<Booking> bookings) {
        List<Booking> changed = new ArrayList<>();
        for (Booking booking : bookings) {
            if (normalize(booking)) {
                changed.add(booking);
            }
        }

        if (!changed.isEmpty()) {
            bookingRepository.saveAll(changed);
        }
        return bookings;
    }

    private boolean normalize(Booking booking) {
        boolean changed = false;
        BookingStatus status = booking.getStatus();
        PaymentStatus paymentStatus = booking.getPaymentStatus();

        if (status == BookingStatus.CONFIRMED) {
            if (paymentStatus != PaymentStatus.PAID) {
                booking.setStatus(BookingStatus.APPROVED);
                booking.setPaymentStatus(PaymentStatus.UNPAID);
                changed = true;
            }
            if (booking.getPaymentAmount() == null && booking.getVendor() != null && booking.getVendor().getStartingPrice() != null) {
                booking.setPaymentAmount(booking.getVendor().getStartingPrice());
                changed = true;
            }
        } else if (status == BookingStatus.APPROVED) {
            if (paymentStatus == null || paymentStatus == PaymentStatus.NOT_READY) {
                booking.setPaymentStatus(PaymentStatus.UNPAID);
                changed = true;
            }
            if (booking.getPaymentAmount() == null && booking.getVendor() != null && booking.getVendor().getStartingPrice() != null) {
                booking.setPaymentAmount(booking.getVendor().getStartingPrice());
                changed = true;
            }
        } else if (status == BookingStatus.REQUESTED) {
            if (paymentStatus == null || paymentStatus == PaymentStatus.UNPAID) {
                booking.setPaymentStatus(PaymentStatus.NOT_READY);
                changed = true;
            }
            if (booking.getPaymentAmount() == null && booking.getVendor() != null && booking.getVendor().getStartingPrice() != null) {
                booking.setPaymentAmount(booking.getVendor().getStartingPrice());
                changed = true;
            }
        } else if (status == BookingStatus.CANCELLED) {
            if (paymentStatus == null) {
                booking.setPaymentStatus(PaymentStatus.NOT_READY);
                changed = true;
            } else if (paymentStatus != PaymentStatus.PAID && paymentStatus != PaymentStatus.NOT_READY) {
                booking.setPaymentStatus(PaymentStatus.NOT_READY);
                changed = true;
            }
        }

        return changed;
    }
}
