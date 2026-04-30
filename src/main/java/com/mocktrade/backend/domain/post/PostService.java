package com.mocktrade.backend.domain.post;


import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;

    public String createPost(Post post) {
        return postRepository.save(post).getPostId();
    }

    public Post getPostDetail(String postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다."));
        post.incrementViewCount();
        return postRepository.save(post);
    }

    public void togglePostLike(String postId, String loginId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다."));
        post.toggleLike(loginId);
        postRepository.save(post);
    }

    // [추가] 댓글 등록 서비스
    public void addComment(String postId, String content, String author) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다."));
        post.addComment(content, author);
        postRepository.save(post);
    }

    public List<Post> findAllPosts() {
        return postRepository.findAll();
    }
}