package com.tammamahad.eventbridge.controller;

import com.tammamahad.eventbridge.entity.Review;
import com.tammamahad.eventbridge.entity.Vendor;
import com.tammamahad.eventbridge.repo.ReviewRepository;
import com.tammamahad.eventbridge.repo.VendorRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/vendors")
public class ReviewController {

    private final ReviewRepository reviewRepository;
    private final VendorRepository vendorRepository;

    public ReviewController(ReviewRepository reviewRepository, VendorRepository vendorRepository) {
        this.reviewRepository = reviewRepository;
        this.vendorRepository = vendorRepository;
    }

    @GetMapping("/{vendorId}/reviews")
    public List<Review> list(@PathVariable Long vendorId) {
        return reviewRepository.findByVendorIdOrderByCreatedAtDesc(vendorId);
    }

    @PostMapping("/{vendorId}/reviews")
    @ResponseStatus(HttpStatus.CREATED)
    public Review create(@PathVariable Long vendorId, @RequestBody CreateReviewRequest req) {
        Vendor vendor = vendorRepository.findById(vendorId)
                .orElseThrow(() -> new RuntimeException("Vendor not found: " + vendorId));

        int rating = req.rating == null ? 0 : req.rating;
        if (rating < 1 || rating > 5) {
            throw new RuntimeException("Rating must be between 1 and 5.");
        }

        String customerName = req.customerName == null ? "" : req.customerName.trim();
        if (customerName.isEmpty()) customerName = "Anonymous";

        String comment = req.comment == null ? "" : req.comment.trim();
        if (comment.length() > 600) {
            throw new RuntimeException("Comment is too long (max 600 characters).");
        }

        Review review = new Review();
        review.setVendor(vendor);
        review.setCustomerName(customerName);
        review.setRating(rating);
        review.setComment(comment.isEmpty() ? null : comment);
        review.setCreatedAt(LocalDateTime.now());

        return reviewRepository.save(review);
    }

    @GetMapping("/ratings/summary")
    public List<VendorRatingSummary> summary() {
        return reviewRepository.summarizeRatingsByVendor().stream()
                .map(row -> new VendorRatingSummary(
                        row.getVendorId(),
                        row.getAverageRating(),
                        row.getReviewCount()
                ))
                .toList();
    }

    public static class CreateReviewRequest {
        public String customerName;
        public Integer rating;
        public String comment;
    }

    public record VendorRatingSummary(Long vendorId, Double averageRating, Long reviewCount) {
    }
}
