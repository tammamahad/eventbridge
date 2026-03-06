package com.tammamahad.eventbridge.repo;

import com.tammamahad.eventbridge.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    List<Review> findByVendorIdOrderByCreatedAtDesc(Long vendorId);

    @Query("""
           select r.vendor.id as vendorId, avg(r.rating) as averageRating, count(r.id) as reviewCount
           from Review r
           group by r.vendor.id
           """)
    List<VendorRatingSummaryRow> summarizeRatingsByVendor();

    interface VendorRatingSummaryRow {
        Long getVendorId();
        Double getAverageRating();
        Long getReviewCount();
    }
}
