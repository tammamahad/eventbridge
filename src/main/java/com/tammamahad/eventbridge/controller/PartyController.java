package com.tammamahad.eventbridge.controller;

import com.tammamahad.eventbridge.entity.Booking;
import com.tammamahad.eventbridge.entity.BookingStatus;
import com.tammamahad.eventbridge.entity.Party;
import com.tammamahad.eventbridge.repo.BookingRepository;
import com.tammamahad.eventbridge.repo.PartyRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/parties")
public class PartyController {

    private final PartyRepository partyRepository;
    private final BookingRepository bookingRepository;

    public PartyController(PartyRepository partyRepository, BookingRepository bookingRepository) {
        this.partyRepository = partyRepository;
        this.bookingRepository = bookingRepository;
    }

    @GetMapping
    public List<PartySummaryResponse> list(@RequestParam String customerEmail) {
        String email = customerEmail == null ? "" : customerEmail.trim();
        if (email.isEmpty()) {
            throw new RuntimeException("Customer email is required.");
        }

        List<Party> parties = partyRepository.findByCustomerEmailIgnoreCaseOrderByEventDateAsc(email);
        return parties.stream().map(this::toSummary).toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Party create(@RequestBody CreatePartyRequest req) {
        if (req == null) throw new RuntimeException("Invalid party payload.");

        String customerName = req.customerName == null ? "" : req.customerName.trim();
        String customerEmail = req.customerEmail == null ? "" : req.customerEmail.trim();
        String name = req.name == null ? "" : req.name.trim();
        String city = req.city == null ? "" : req.city.trim();
        String eventDate = req.eventDate == null ? "" : req.eventDate.trim();

        if (customerName.isEmpty()) throw new RuntimeException("Customer name is required.");
        if (customerEmail.isEmpty()) throw new RuntimeException("Customer email is required.");
        if (name.isEmpty()) throw new RuntimeException("Party name is required.");
        if (city.isEmpty()) throw new RuntimeException("City is required.");
        if (eventDate.isEmpty()) throw new RuntimeException("Event date is required.");

        LocalDate date = LocalDate.parse(eventDate);

        Party party = new Party();
        party.setCustomerName(customerName);
        party.setCustomerEmail(customerEmail.toLowerCase());
        party.setName(name);
        party.setEventDate(date);
        party.setCity(city);
        party.setVenue(req.venue == null ? null : req.venue.trim());
        party.setBudget(req.budget);
        party.setNotes(req.notes == null ? null : req.notes.trim());
        return partyRepository.save(party);
    }

    private PartySummaryResponse toSummary(Party party) {
        List<Booking> bookings = bookingRepository.findByPartyId(party.getId());
        int requestedTotal = 0;
        int confirmedTotal = 0;
        List<PartyBookingItem> bookingItems = new ArrayList<>();

        for (Booking b : bookings) {
            int estimatedCost = b.getVendor() != null && b.getVendor().getStartingPrice() != null
                    ? b.getVendor().getStartingPrice()
                    : 0;

            if (b.getStatus() == BookingStatus.REQUESTED) requestedTotal += estimatedCost;
            if (b.getStatus() == BookingStatus.CONFIRMED) confirmedTotal += estimatedCost;

            bookingItems.add(new PartyBookingItem(
                    b.getId(),
                    b.getVendor() == null ? null : b.getVendor().getId(),
                    b.getVendor() == null ? "Vendor" : b.getVendor().getBusinessName(),
                    b.getStatus().name(),
                    b.getEventDate().toString(),
                    estimatedCost
            ));
        }

        String status = party.getEventDate().isBefore(LocalDate.now()) ? "COMPLETED" : "UPCOMING";
        Integer budget = party.getBudget();
        Integer remaining = budget == null ? null : budget - confirmedTotal;

        return new PartySummaryResponse(
                party.getId(),
                party.getName(),
                party.getEventDate().toString(),
                party.getCity(),
                party.getVenue(),
                party.getBudget(),
                party.getNotes(),
                status,
                requestedTotal,
                confirmedTotal,
                remaining,
                bookingItems
        );
    }

    public static class CreatePartyRequest {
        public String customerName;
        public String customerEmail;
        public String name;
        public String eventDate;
        public String city;
        public String venue;
        public Integer budget;
        public String notes;
    }

    public record PartyBookingItem(
            Long bookingId,
            Long vendorId,
            String vendorName,
            String status,
            String eventDate,
            Integer estimatedCost
    ) {
    }

    public record PartySummaryResponse(
            Long id,
            String name,
            String eventDate,
            String city,
            String venue,
            Integer budget,
            String notes,
            String status,
            Integer requestedTotal,
            Integer confirmedTotal,
            Integer remainingBudget,
            List<PartyBookingItem> bookings
    ) {
    }
}
