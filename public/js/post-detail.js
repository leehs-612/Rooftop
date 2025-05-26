document.addEventListener('DOMContentLoaded', async () => {
    const detailTitle = document.getElementById('detailTitle');
    const detailContent = document.getElementById('detailContent');
    const postNotFound = document.getElementById('postNotFound');
    const postDetailContainer = document.getElementById('post-detail-container');
    const likePostBtn = document.getElementById('likePostBtn');
    const dislikePostBtn = document.getElementById('dislikePostBtn');
    const postLikesCount = document.getElementById('postLikesCount');
    const postDislikesCount = document.getElementById('postDislikesCount');
    const reportPostBtn = document.getElementById('reportPostBtn');
    const postReportsCount = document.getElementById('postReportsCount');

    const commentsList = document.getElementById('commentsList');
    const noCommentsMessage = document.getElementById('noCommentsMessage');
    const commentForm = document.getElementById('commentForm');
    const commentContentInput = document.getElementById('commentContent');

    // URL에서 게시글 ID 추출 (메모리 저장 방식에서는 ID가 숫자이므로 parseInt 사용)
    const pathSegments = window.location.pathname.split('/');
    const postId = parseInt(pathSegments[pathSegments.length - 1]); // <--- parseInt 다시 추가

    let currentPostData = null;

    // --- 로컬 스토리지 관련 함수 ---
    function getLocalStorageKey(entityType, id, actionType) {
        return `oktopbang_${entityType}_${id}_${actionType}`;
    }

    function saveActionToLocalStorage(entityType, id, actionType) {
        localStorage.setItem(getLocalStorageKey(entityType, id, actionType), 'true');
    }

    function hasActed(entityType, id, actionType) {
        return localStorage.getItem(getLocalStorageKey(entityType, id, actionType)) === 'true';
    }

    function updateButtonState(button, entityType, id, actionType) {
        if (hasActed(entityType, id, actionType)) {
            button.disabled = true;
            button.classList.add('acted');
            if (actionType === 'like') button.classList.add('liked');
            if (actionType === 'dislike') button.classList.add('disliked');
            if (actionType === 'report') button.classList.add('reported');
        }
    }

    // --- 게시글 상세 정보 로딩 ---
    async function fetchPostDetail() {
        if (isNaN(postId)) { // ID가 숫자가 아니면 유효하지 않음
            postDetailContainer.style.display = 'none';
            postNotFound.style.display = 'block';
            detailTitle.textContent = '잘못된 접근';
            detailContent.innerHTML = '<p>유효하지 않은 게시글 ID입니다.</p>';
            return;
        }

        try {
            const response = await fetch(`/api/post/${postId}`);
            if (response.ok) {
                currentPostData = await response.json();
                detailTitle.textContent = currentPostData.title;
                detailContent.innerHTML = currentPostData.content;
                updatePostVoteCounts(currentPostData.likes, currentPostData.dislikes);
                updatePostReportsCount(currentPostData.reports || 0);

                updateButtonState(likePostBtn, 'post', postId, 'like');
                updateButtonState(dislikePostBtn, 'post', postId, 'dislike');
                updateButtonState(reportPostBtn, 'post', postId, 'report');

            } else {
                postDetailContainer.style.display = 'none';
                postNotFound.style.display = 'block';
                detailTitle.textContent = '게시글 없음 또는 삭제됨';
                detailContent.innerHTML = '<p>요청하신 게시글을 찾을 수 없거나 삭제되었습니다.</p>';
            }
        } catch (error) {
            console.error('게시글 상세 내용을 가져오는 중 오류 발생:', error);
            postDetailContainer.style.display = 'none';
            postNotFound.style.display = 'block';
            detailTitle.textContent = '오류 발생';
            detailContent.innerHTML = '<p>게시글을 불러오는 중 오류가 발생했습니다.</p>';
        }
    }

    // --- 게시글 좋아요/싫어요/신고 카운트 업데이트 ---
    function updatePostVoteCounts(likes, dislikes) {
        postLikesCount.textContent = likes;
        postDislikesCount.textContent = dislikes;
    }

    function updatePostReportsCount(reports) {
        postReportsCount.textContent = reports;
    }

    // --- 게시글 좋아요/싫어요 버튼 클릭 이벤트 ---
    if (likePostBtn) {
        likePostBtn.addEventListener('click', async () => {
            if (hasActed('post', postId, 'like')) {
                alert('이미 이 게시글에 좋아요를 눌렀습니다.');
                return;
            }
            const success = await sendPostVote(postId, 'like');
            if (success) saveActionToLocalStorage('post', postId, 'like');
            updateButtonState(likePostBtn, 'post', postId, 'like');
        });
    }
    if (dislikePostBtn) {
        dislikePostBtn.addEventListener('click', async () => {
            if (hasActed('post', postId, 'dislike')) {
                alert('이미 이 게시글에 싫어요를 눌렀습니다.');
                return;
            }
            const success = await sendPostVote(postId, 'dislike');
            if (success) saveActionToLocalStorage('post', postId, 'dislike');
            updateButtonState(dislikePostBtn, 'post', postId, 'dislike');
        });
    }

    async function sendPostVote(id, type) {
        try {
            const response = await fetch(`/api/post/${id}/vote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type })
            });
            if (response.ok) {
                const data = await response.json();
                updatePostVoteCounts(data.likes, data.dislikes);
                return true;
            } else {
                const errorData = await response.json();
                alert('투표 실패: ' + errorData.message);
                return false;
            }
        } catch (error) {
            console.error('게시글 투표 중 오류 발생:', error);
            alert('투표 중 오류가 발생했습니다.');
            return false;
        }
    }

    // --- 게시글 신고 버튼 클릭 이벤트 ---
    if (reportPostBtn) {
        reportPostBtn.addEventListener('click', async () => {
            if (hasActed('post', postId, 'report')) {
                alert('이미 이 게시글을 신고했습니다.');
                return;
            }
            if (confirm('이 게시글을 신고하시겠습니까? 신고 누적 시 자동으로 삭제될 수 있습니다.')) {
                try {
                    const response = await fetch(`/api/post/${postId}/report`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' }
                    });
                    const data = await response.json();
                    if (response.ok) {
                        alert(data.message);
                        if (data.deleted) {
                            window.location.href = '/'; // 삭제되었으면 홈으로 이동
                        } else {
                            updatePostReportsCount(data.reports); // 신고 횟수 업데이트
                            saveActionToLocalStorage('post', postId, 'report'); // 로컬 스토리지에 기록
                            updateButtonState(reportPostBtn, 'post', postId, 'report'); // 버튼 비활성화
                        }
                    } else {
                        const errorData = await response.json();
                        alert('신고 실패: ' + errorData.message);
                    }
                } catch (error) {
                    console.error('게시글 신고 중 오류 발생:', error);
                    alert('신고 중 오류가 발생했습니다.');
                }
            }
        });
    }

    // --- 댓글 목록 로딩 ---
    async function fetchComments() {
        if (isNaN(postId)) return; // ID가 숫자가 아니면 댓글도 불러오지 않음

        try {
            const response = await fetch(`/api/comments/${postId}`);
            const comments = await response.json();

            commentsList.innerHTML = '';

            if (comments.length > 0) {
                noCommentsMessage.style.display = 'none';
                comments.forEach(comment => {
                    const commentElement = createCommentElement(comment);
                    commentsList.appendChild(commentElement);
                });
            } else {
                noCommentsMessage.style.display = 'block';
            }
        } catch (error) {
            console.error('댓글을 가져오는 중 오류 발생:', error);
            commentsList.innerHTML = '<p>댓글을 불러올 수 없습니다.</p>';
        }
    }

    // 댓글 HTML 요소 생성 함수
    function createCommentElement(comment, isReply = false) {
        const listItem = document.createElement('li');
        listItem.classList.add('comment-item');
        if (isReply) {
            listItem.classList.add('reply-item');
        }

        listItem.innerHTML = `
            <div class="comment-meta">
                <span class="comment-author">${comment.author || '익명'}</span>
            </div>
            <p class="comment-content">${comment.content}</p>
            <div class="comment-actions">
                <button class="vote-btn like-comment-btn" data-comment-id="${comment.id}">좋아요 (<span class="comment-likes-count">${comment.likes}</span>)</button>
                <button class="vote-btn dislike-comment-btn" data-comment-id="${comment.id}">싫어요 (<span class="comment-dislikes-count">${comment.dislikes}</span>)</button>
                <button class="reply-btn" data-comment-id="${comment.id}">답글</button>
            </div>
            <div class="replies-container" id="replies-for-${comment.id}"></div>
        `;

        // 댓글 좋아요/싫어요 버튼 상태 업데이트
        const likeCommentBtn = listItem.querySelector('.like-comment-btn');
        const dislikeCommentBtn = listItem.querySelector('.dislike-comment-btn');
        updateButtonState(likeCommentBtn, 'comment', comment.id, 'like');
        updateButtonState(dislikeCommentBtn, 'comment', comment.id, 'dislike');


        const replyBtn = listItem.querySelector('.reply-btn');
        const repliesContainer = listItem.querySelector('.replies-container');

        replyBtn.addEventListener('click', () => {
            if (repliesContainer.querySelector('.reply-form')) {
                repliesContainer.innerHTML = '';
                replyBtn.textContent = '답글';
            } else {
                const replyFormHtml = `
                    <form class="reply-form" data-parent-id="${comment.id}">
                        <textarea placeholder="답글을 입력하세요" required class="reply-content-input"></textarea>
                        <button type="submit">답글 작성</button>
                        <button type="button" class="cancel-reply-btn">취소</button>
                    </form>
                `;
                repliesContainer.innerHTML = replyFormHtml;
                replyBtn.textContent = '답글 숨기기';

                const replyForm = repliesContainer.querySelector('.reply-form');
                const cancelReplyBtn = repliesContainer.querySelector('.cancel-reply-btn');

                replyForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const content = replyForm.querySelector('.reply-content-input').value.trim();
                    const parentId = parseInt(replyForm.dataset.parentId); // 부모 ID도 숫자로

                    if (!content) {
                        alert('답글 내용을 입력해주세요.');
                        return;
                    }
                    await sendComment(postId, parentId, content);
                    repliesContainer.innerHTML = '';
                    replyBtn.textContent = '답글';
                });

                cancelReplyBtn.addEventListener('click', () => {
                    repliesContainer.innerHTML = '';
                    replyBtn.textContent = '답글';
                });
            }
        });

        listItem.querySelector('.like-comment-btn').addEventListener('click', async (e) => {
            const commentId = parseInt(e.currentTarget.dataset.commentId); // 댓글 ID도 숫자로
            if (hasActed('comment', commentId, 'like')) {
                alert('이미 이 댓글에 좋아요를 눌렀습니다.');
                return;
            }
            const success = await sendCommentVote(commentId, 'like');
            if (success) saveActionToLocalStorage('comment', commentId, 'like');
            updateButtonState(e.currentTarget, 'comment', commentId, 'like');
        });
        listItem.querySelector('.dislike-comment-btn').addEventListener('click', async (e) => {
            const commentId = parseInt(e.currentTarget.dataset.commentId); // 댓글 ID도 숫자로
            if (hasActed('comment', commentId, 'dislike')) {
                alert('이미 이 댓글에 싫어요를 눌렀습니다.');
                return;
            }
            const success = await sendCommentVote(commentId, 'dislike');
            if (success) saveActionToLocalStorage('comment', commentId, 'dislike');
            updateButtonState(e.currentTarget, 'comment', commentId, 'dislike');
        });

        if (comment.replies && comment.replies.length > 0) {
            const repliesDiv = document.createElement('div');
            repliesDiv.classList.add('nested-replies');
            comment.replies.forEach(reply => {
                repliesDiv.appendChild(createCommentElement(reply, true));
            });
            listItem.appendChild(repliesDiv);
        }

        return listItem;
    }


    // --- 댓글 작성 처리 (메인 댓글, 대댓글 모두 처리) ---
    if (commentForm) {
        commentForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const content = commentContentInput.value.trim();

            if (!content) {
                alert('댓글 내용을 입력해주세요.');
                return;
            }
            await sendComment(postId, null, content);
            commentContentInput.value = '';
        });
    }

    async function sendComment(postId, parentId, content) {
        try {
            const response = await fetch('/api/comments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ postId: postId, parentId: parentId, content: content })
            });

            if (response.ok) {
                await fetchComments();
                return true;
            } else {
                const errorData = await response.json();
                alert(`댓글 작성 실패: ${errorData.message}`);
                return false;
            }
        } catch (error) {
            console.error('댓글 작성 중 오류 발생:', error);
            alert('댓글 작성 중 오류가 발생했습니다.');
            return false;
        }
    }

    // --- 댓글 좋아요/싫어요 전송 ---
    async function sendCommentVote(commentId, type) {
        try {
            const response = await fetch(`/api/comment/${commentId}/vote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type })
            });
            if (response.ok) {
                await fetchComments();
                return true;
            } else {
                const errorData = await response.json();
                alert('댓글 투표 실패: ' + errorData.message);
                return false;
            }
        } catch (error) {
            console.error('댓글 투표 중 오류 발생:', error);
            alert('댓글 투표 중 오류가 발생했습니다.');
            return false;
        }
    }

    // 페이지 로드 시 게시글 상세와 댓글 불러오기
    fetchPostDetail();
    fetchComments();
});