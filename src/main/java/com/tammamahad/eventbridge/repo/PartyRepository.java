package com.tammamahad.eventbridge.repo;

import com.tammamahad.eventbridge.entity.Party;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PartyRepository extends JpaRepository<Party, Long> {
    List<Party> findByCustomerEmailIgnoreCaseOrderByEventDateAsc(String customerEmail);
}
