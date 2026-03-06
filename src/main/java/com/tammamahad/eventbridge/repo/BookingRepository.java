package com.tammamahad.eventbridge.repo;

import com.tammamahad.eventbridge.entity.Booking;
import com.tammamahad.eventbridge.entity.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    List<Booking> findByVendorId(Long vendorId);

    boolean existsByVendorIdAndEventDate(Long vendorId, LocalDate eventDate);

    List<Booking> findByVendorIdAndEventDateBetween(Long vendorId, LocalDate from, LocalDate to);

    List<Booking> findByVendorIdAndStatus(Long vendorId, BookingStatus status);

    List<Booking> findByVendorIdAndStatusAndEventDateGreaterThanEqual(Long vendorId, BookingStatus status, LocalDate eventDate);

    List<Booking> findByCustomerEmailIgnoreCaseOrderByEventDateDesc(String customerEmail);

    List<Booking> findByPartyId(Long partyId);

}
