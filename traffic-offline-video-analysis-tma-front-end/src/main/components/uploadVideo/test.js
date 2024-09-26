document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('myCanvas');
    const ctx = canvas.getContext('2d');
    const pointsArray = [];
    let isDrawing = false;
    let pointsCount = 0;
    canvas.addEventListener('mousedown', function(e) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
 
        // Start drawing when the first point is clicked
        if (!isDrawing) {
            isDrawing = true;
            pointsArray.push({x, y});
            drawCurrentPoints(pointsArray);
        } else {
            // Check distance to the first point to close the zone
            const firstPoint = pointsArray[0];
            const dx = x - firstPoint.x;
            const dy = y - firstPoint.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const threshold = 15; // Adjust based on desired sensitivity
 
            if (distance <= threshold) {
                // Close the zone
                drawZone(pointsArray);
                console.log("point added:", JSON.stringify(pointsArray));
                pointsArray.length = 0; // Clear the array for the next zone
                isDrawing = false;
                console.log("point added:", JSON.stringify(pointsArray));
            } else {
                // Add new point
                pointsArray.push({x, y});
                pointsCount++;
                drawCurrentPoints(pointsArray);
 
                if (pointsCount == 9) {
                    // If more than 10 points have been added, treat this as closing the zone
                    drawZone(pointsArray);
                    console.log("point added:", JSON.stringify(pointsArray));
                    pointsArray.length = 0;
                    isDrawing = false;
                    pointsCount = 0; // Reset the points count
                }
            }
        }
    });
 
    function drawCurrentPoints(points) {
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas
   
        // Draw circles at each point
        ctx.beginPath();
       
         points.forEach(point => {
        ctx.beginPath(); // Start a new path for each circle
        ctx.arc(point.x, point.y, 5, 0, Math.PI * 2, true); // Draw a circle at the point's location
        ctx.fillStyle = "green";
        ctx.fill();
    });
   
        // Draw lines connecting the points
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.strokeStyle = "yellow";
        ctx.stroke();
    }
 
    function drawZone(points) {
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
 
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
 
        ctx.closePath(); // Close the path to connect the last point to the first
        ctx.fillStyle = "rgba(0, 0, 255, 0.3)";
        ctx.fill();
        ctx.strokeStyle = "blue";
        ctx.stroke();
    }
     // Select the clear button
     const clearButton = document.getElementById('clearButton');
 
     // Function to clear the canvas
     function clearCanvas() {
        pointsCount = 0;
        pointsArray.length = 0; // Clear the points array
        isDrawing = false; // Reset the drawing state
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the visual representation of the canvas
        drawCurrentPoints([]); // Redraw the canvas without points
    }
 
     // Attach the clear function to the button's click event
     clearButton.addEventListener('click', clearCanvas);
});