package com.svalero.RosasTattoo.service;

import com.svalero.RosasTattoo.domain.Appointment;
import com.svalero.RosasTattoo.domain.Client;
import com.svalero.RosasTattoo.domain.Review;
import com.svalero.RosasTattoo.domain.UserAccount;
import com.svalero.RosasTattoo.domain.enums.AppointmentState;
import com.svalero.RosasTattoo.dto.ReviewDto;
import com.svalero.RosasTattoo.dto.ReviewInDto;
import com.svalero.RosasTattoo.exception.AppointmentNotFoundException;
import com.svalero.RosasTattoo.exception.ClientNotFoundException;
import com.svalero.RosasTattoo.exception.ReviewNotFoundException;
import com.svalero.RosasTattoo.repository.AppointmentRepository;
import com.svalero.RosasTattoo.repository.ClientRepository;
import com.svalero.RosasTattoo.repository.ReviewRepository;
import com.svalero.RosasTattoo.repository.UserAccountRepository;
import org.modelmapper.ModelMapper;
import org.modelmapper.TypeToken;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ReviewService {

    @Autowired
    private ReviewRepository reviewRepository;
    @Autowired
    private AppointmentRepository appointmentRepository;
    @Autowired
    private ClientRepository clientRepository;
    @Autowired
    private UserAccountRepository userAccountRepository;
    @Autowired
    private ModelMapper modelMapper;

    public List<ReviewDto> findAll(Integer rating, Long professionalId, Boolean wouldRecommend) {
        List<Review> reviews = reviewRepository.findByFilters(rating, professionalId, wouldRecommend);
        return modelMapper.map(reviews, new TypeToken<List<ReviewDto>>() {}.getType());
    }

    public ReviewDto findById(long id) throws ReviewNotFoundException {
        Review review = reviewRepository.findById(id)
                .orElseThrow(ReviewNotFoundException::new);

        return modelMapper.map(review, ReviewDto.class);
    }

    public ReviewDto addSecured(ReviewInDto reviewInDto, String email)
            throws AppointmentNotFoundException, ClientNotFoundException {

        Client me = getClientFromEmail(email);

        Appointment appointment = appointmentRepository.findById(reviewInDto.getAppointmentId())
                .orElseThrow(AppointmentNotFoundException::new);

        if (appointment.getClient() == null || appointment.getClient().getId() != me.getId()) {
            throw new AccessDeniedException("You cannot review an appointment that is not yours");
        }

        if (reviewRepository.existsByAppointment_Id(appointment.getId())) {
            throw new IllegalStateException("This appointment already has a review");
        }

        if (appointment.getStartDateTime() == null || appointment.getStartDateTime().isAfter(LocalDateTime.now())) {
            throw new IllegalStateException("You can only review an appointment after it has taken place");
        }

        if (appointment.getState() == AppointmentState.CANCELLED || appointment.getState() == AppointmentState.NO_SHOW) {
            throw new IllegalStateException("You cannot review a cancelled or no-show appointment");
        }

        if (appointment.getState() != AppointmentState.CONFIRMED && appointment.getState() != AppointmentState.COMPLETED) {
            throw new IllegalStateException("Only confirmed appointments can be reviewed");
        }

        Review review = new Review();
        modelMapper.map(reviewInDto, review);

        review.setAppointment(appointment);
        review.setCreatedAt(LocalDateTime.now());

        Review saved = reviewRepository.save(review);

        appointment.setState(AppointmentState.COMPLETED);
        appointmentRepository.save(appointment);

        me.setVisits(me.getVisits() + 1);
        clientRepository.save(me);

        return modelMapper.map(saved, ReviewDto.class);
    }

    public ReviewDto add(ReviewInDto reviewInDto) throws AppointmentNotFoundException {
        Appointment appointment = appointmentRepository.findById(reviewInDto.getAppointmentId())
                .orElseThrow(AppointmentNotFoundException::new);

        Review review = new Review();
        modelMapper.map(reviewInDto, review);

        review.setAppointment(appointment);
        review.setCreatedAt(LocalDateTime.now());

        Review saved = reviewRepository.save(review);

        appointment.setState(AppointmentState.COMPLETED);
        appointmentRepository.save(appointment);

        return modelMapper.map(saved, ReviewDto.class);
    }

    public ReviewDto modify(long id, ReviewInDto reviewInDto) throws ReviewNotFoundException {
        Review existing = reviewRepository.findById(id)
                .orElseThrow(ReviewNotFoundException::new);

        Appointment keepAppointment = existing.getAppointment();
        LocalDateTime keepCreatedAt = existing.getCreatedAt();

        modelMapper.map(reviewInDto, existing);
        existing.setId(id);
        existing.setAppointment(keepAppointment);
        existing.setCreatedAt(keepCreatedAt);

        Review saved = reviewRepository.save(existing);
        return modelMapper.map(saved, ReviewDto.class);
    }

    public void delete(long id) throws ReviewNotFoundException {
        Review review = reviewRepository.findById(id)
                .orElseThrow(ReviewNotFoundException::new);

        reviewRepository.delete(review);
    }

    private Client getClientFromEmail(String email) throws ClientNotFoundException {
        UserAccount account = userAccountRepository.findByEmail(email)
                .orElseThrow(() -> new AccessDeniedException("Account not found"));

        if (account.getClient() == null) {
            throw new AccessDeniedException("This account is not a client");
        }

        return account.getClient();
    }
}