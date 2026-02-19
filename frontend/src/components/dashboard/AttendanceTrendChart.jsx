import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const AttendanceTrendChart = () => {
    // Mock Data for Attendance Trends
    const data = {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'],
        datasets: [
            {
                label: 'Average Attendance (%)',
                data: [85, 88, 82, 90, 87],
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
                tension: 0.3,
            },
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    color: '#9ca3af',
                },
            },
            title: {
                display: false,
                text: 'Attendance Trends',
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                max: 100,
                grid: {
                    color: 'rgba(75, 85, 99, 0.2)',
                },
                ticks: {
                    color: '#9ca3af',
                },
            },
            x: {
                grid: {
                    display: false,
                },
                ticks: {
                    color: '#9ca3af',
                },
            },
        },
    };

    return (
        <div className="card bg-base-100 shadow-xl mb-6">
            <div className="card-body">
                <h2 className="card-title text-sm uppercase text-base-content/50 mb-4">Attendance Trends</h2>
                <div className="h-64 flex items-center justify-center">
                    <Line data={data} options={options} />
                </div>
            </div>
        </div>
    );
};

export default AttendanceTrendChart;
