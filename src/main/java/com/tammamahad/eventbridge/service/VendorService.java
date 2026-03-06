package com.tammamahad.eventbridge.service;

import com.tammamahad.eventbridge.entity.Vendor;
import com.tammamahad.eventbridge.repo.VendorRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class VendorService {

    private final VendorRepository vendorRepository;

    public VendorService(VendorRepository vendorRepository) {
        this.vendorRepository = vendorRepository;
    }

    public List<Vendor> getAll(String category, String city) {
        if (category != null && city != null) {
            return vendorRepository.findByCategoryIgnoreCaseAndCityIgnoreCase(category, city);
        }
        if (category != null) {
            return vendorRepository.findByCategoryIgnoreCase(category);
        }
        if (city != null) {
            return vendorRepository.findByCityIgnoreCase(city);
        }
        return vendorRepository.findAll();
    }

    public Vendor create(Vendor vendor) {
        vendor.setId(null); // ensure it's treated as new
        return vendorRepository.save(vendor);
    }

    public Vendor update(Long id, Vendor updated) {
        Vendor existing = vendorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vendor not found: " + id));

        existing.setBusinessName(updated.getBusinessName());
        existing.setCategory(updated.getCategory());
        existing.setCity(updated.getCity());
        existing.setPhone(updated.getPhone());
        existing.setEmail(updated.getEmail());

        return vendorRepository.save(existing);
    }

    public void delete(Long id) {
        vendorRepository.deleteById(id);
    }
}
