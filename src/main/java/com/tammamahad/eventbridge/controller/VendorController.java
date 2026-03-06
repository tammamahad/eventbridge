package com.tammamahad.eventbridge.controller;

import com.tammamahad.eventbridge.entity.Booking;
import com.tammamahad.eventbridge.entity.Vendor;
import com.tammamahad.eventbridge.repo.BookingRepository;
import com.tammamahad.eventbridge.repo.VendorRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/vendors")
public class VendorController {

    private final VendorRepository vendorRepository;
    private final BookingRepository bookingRepository;

    public VendorController(VendorRepository vendorRepository, BookingRepository bookingRepository) {
        this.vendorRepository = vendorRepository;
        this.bookingRepository = bookingRepository;
    }

    // GET /vendors
    @GetMapping
    public List<Vendor> getAllVendors() {
        return vendorRepository.findAll();
    }

    // POST /vendors
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Vendor createVendor(@RequestBody Vendor vendor) {
        vendor.setId(null);
        return vendorRepository.save(vendor);
    }

    // GET /vendors/1
    @GetMapping("/{id}")
    public Vendor getVendorById(@PathVariable Long id) {
        return vendorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vendor not found: " + id));
    }

    // PUT /vendors/1
    @PutMapping("/{id}")
    public Vendor updateVendor(@PathVariable Long id, @RequestBody Vendor updated) {
        Vendor existing = vendorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vendor not found: " + id));

        existing.setBusinessName(updated.getBusinessName());
        existing.setCategory(updated.getCategory());
        existing.setCity(updated.getCity());
        existing.setPhone(updated.getPhone());
        existing.setEmail(updated.getEmail());
        existing.setShortDescription(updated.getShortDescription());
        existing.setAddress(updated.getAddress());
        existing.setLatitude(updated.getLatitude());
        existing.setLongitude(updated.getLongitude());
        existing.setStartingPrice(updated.getStartingPrice());
        existing.setPricingType(updated.getPricingType());
        existing.setPriceNote(updated.getPriceNote());

        return vendorRepository.save(existing);
    }

    // DELETE /vendors/1
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteVendor(@PathVariable Long id) {
        vendorRepository.deleteById(id);
    }

    // GET /vendors/1/availability?from=2026-03-14&to=2026-03-18
    @GetMapping("/{id}/availability")
    public Map<String, Object> availability(
            @PathVariable Long id,
            @RequestParam String from,
            @RequestParam String to
    ) {
        LocalDate start = LocalDate.parse(from);
        LocalDate end = LocalDate.parse(to);

        List<Booking> bookings = bookingRepository.findByVendorIdAndEventDateBetween(id, start, end);

        Set<LocalDate> booked = new HashSet<>();
        for (Booking b : bookings) {
            booked.add(b.getEventDate());
        }

        List<String> bookedDates = booked.stream()
                .sorted()
                .map(LocalDate::toString)
                .toList();

        List<String> availableDates = new ArrayList<>();
        for (LocalDate d = start; !d.isAfter(end); d = d.plusDays(1)) {
            if (!booked.contains(d)) {
                availableDates.add(d.toString());
            }
        }

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("vendorId", id);
        out.put("from", start.toString());
        out.put("to", end.toString());
        out.put("bookedDates", bookedDates);
        out.put("availableDates", availableDates);

        return out;
    }
}
