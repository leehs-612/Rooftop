document.addEventListener('DOMContentLoaded', () => {
    const postsList = document.getElementById('postsList');
    const noPostsMessage = document.getElementById('noPostsMessage');

    async function fetchPosts() {
        try {
            const response = await fetch('/api/posts');
            const posts = await response.json();

            postsList.innerHTML = '';

            if (posts.length > 0) {
                noPostsMessage.style.display = 'none';
                posts.forEach(post => {
                    const listItem = document.createElement('li');
                    // 게시글 제목 클릭 시 상세 페이지로 이동
                    listItem.innerHTML = `<h4><a href="/post/${post.id}">${post.title}</a></h4>`;
                    postsList.appendChild(listItem);
                });
            } else {
                noPostsMessage.style.display = 'block';
            }
        } catch (error) {
            console.error('게시글을 가져오는 중 오류 발생:', error);
            postsList.innerHTML = '<p>게시글을 불러올 수 없습니다.</p>';
        }
    }

    fetchPosts();
});