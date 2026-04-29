package com.mocktrade.backend.domain.post;


import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;

    // 글 저장
    public String createPost(Post post) {
        return postRepository.save(post).getPostId();
    }

    // 상세 조회 (조회수 증가 포함)
    public Post getPostDetail(String postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다."));

        post.incrementViewCount(); // 엔티티 로직 호출
        return postRepository.save(post);
    }

    // 좋아요 토글 (사용자님이 말씀하신 핵심 로직)
    public void togglePostLike(String postId, String loginId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다."));

        post.toggleLike(loginId); // 엔티티 내부의 리스트 조작 로직 호출
        postRepository.save(post); // 변경사항 반영
    }

    // 전체 목록 조회
    public List<Post> findAllPosts() {
        return postRepository.findAll();
    }
}