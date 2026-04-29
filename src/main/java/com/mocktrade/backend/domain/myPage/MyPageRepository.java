package com.mocktrade.backend.domain.myPage;

import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;

/**
 * 마이페이지(보유 주식) 전용 레포지토리
 * MongoDB의 'my_pages' 컬렉션과 연결됩니다.
 */
public interface MyPageRepository extends MongoRepository<MyPage, String> {

    /**
     * 특정 사용자가 보유한 모든 주식 리스트 조회
     * 마이페이지 메인 화면에서 내 자산 목록을 뿌려줄 때 사용합니다.
     */
    List<MyPage> findAllByMemberId(String memberId);

    /**
     * 특정 사용자가 특정 종목을 가지고 있는지 확인
     * 매수 시 수량 업데이트를 하거나, 매도 시 보유 여부를 체크할 때 사용합니다.
     */
    Optional<MyPage> findByMemberIdAndStockCode(String memberId, String stockCode);

    /**
     * 특정 사용자의 특정 주식을 삭제 (수량이 0이 되었을 때)
     */
    void deleteByMemberIdAndStockCode(String memberId, String stockCode);
}