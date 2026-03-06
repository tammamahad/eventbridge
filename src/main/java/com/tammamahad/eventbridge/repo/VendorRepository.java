package com.tammamahad.eventbridge.repo;

import com.tammamahad.eventbridge.entity.Vendor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VendorRepository extends JpaRepository<Vendor, Long> {
    List<Vendor> findByCategoryIgnoreCase(String category);
    List<Vendor> findByCityIgnoreCase(String city);
    List<Vendor> findByCategoryIgnoreCaseAndCityIgnoreCase(String category, String city);
}
