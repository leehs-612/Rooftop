document.addEventListener('DOMContentLoaded', async () => {
    const roomList = document.getElementById('roomList');

    try {
        const response = await fetch('/api/rooms');
        const rooms = await response.json();

        if (rooms.length > 0) {
            rooms.forEach(room => {
                const listItem = document.createElement('li');
                // 각 방으로 이동하는 링크 생성
                listItem.innerHTML = `<a href="/room/${room.id}">${room.name}</a>`;
                roomList.appendChild(listItem);
            });
        } else {
            roomList.innerHTML = '<p>아직 개설된 방이 없습니다.</p>';
        }
    } catch (error) {
        console.error('방 목록을 가져오는 중 오류 발생:', error);
        roomList.innerHTML = '<p>방 목록을 불러올 수 없습니다.</p>';
    }
});