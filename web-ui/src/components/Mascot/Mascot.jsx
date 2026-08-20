import React, { useRef, useState } from "react";
import { useRive } from "@rive-app/react-canvas";
import "./Mascot.css";

const Mascot = () => {
    const mascotRef = useRef(null);

    const [hovered, setHovered] = useState(false);
    const [dragging, setDragging] = useState(false);
    const [position, setPosition] = useState({
        x: window.innerWidth - 210,
        y: window.innerHeight - 210,
    });

    const dragOffset = useRef({ x: 0, y: 0 });

    const { RiveComponent } = useRive({
        src: "/mascot/bunny.riv",
        autoplay: true,
    });

    const handlePointerDown = (e) => {
        e.preventDefault();

        const rect = mascotRef.current.getBoundingClientRect();

        dragOffset.current = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        };

        setDragging(true);

        mascotRef.current.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e) => {
        if (!dragging) return;

        const mascotWidth = mascotRef.current.offsetWidth;
        const mascotHeight = mascotRef.current.offsetHeight;

        let x = e.clientX - dragOffset.current.x;
        let y = e.clientY - dragOffset.current.y;

        // Keep mascot inside screen
        x = Math.max(0, Math.min(x, window.innerWidth - mascotWidth));
        y = Math.max(0, Math.min(y, window.innerHeight - mascotHeight));

        setPosition({ x, y });
    };

    const handlePointerUp = () => {
        setDragging(false);
    };

    const handleClick = () => {
        if (dragging) return;

        console.log("🐰 Bunny clicked!");

        // Cute click reaction
        mascotRef.current.classList.add("mascot-click");

        setTimeout(() => {
            mascotRef.current?.classList.remove("mascot-click");
        }, 500);
    };

    return (
        <div
            ref={mascotRef}
            className={`mascot-container 
        ${hovered ? "mascot-hover" : ""} 
        ${dragging ? "mascot-dragging" : ""}
      `}
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
            }}
            onPointerEnter={() => setHovered(true)}
            onPointerLeave={() => setHovered(false)}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onClick={handleClick}
        >
            <RiveComponent />

            {hovered && !dragging && (
                <div className="mascot-heart">
                    ♥
                </div>
            )}
        </div>
    );
};

export default Mascot;