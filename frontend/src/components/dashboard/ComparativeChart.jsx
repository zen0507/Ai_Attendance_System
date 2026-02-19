import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { BarChart2 } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

/**
 * ComparativeChart — Performance vs Class Average
 * Props:
 *   marks: array of { subject, studentTotal, classAvg } from getClassAverage endpoint
 */
const ComparativeChart = ({ marks = [] }) => {
    if (!marks || marks.length === 0) {
        return (
            <div className="card bg-base-100 shadow-xl border border-base-200">
                <div className="card-body">
                    <h2 className="card-title text-sm uppercase text-base-content/50 mb-4 flex items-center gap-2">
                        <BarChart2 size={18} /> Performance vs Class
                    </h2>
                    <div className="flex flex-col items-center justify-center h-48 opacity-40">
                        <BarChart2 size={40} className="mb-3" />
                        <p className="text-sm">No marks data available yet.</p>
                        <p className="text-xs mt-1">Chart will appear once your teacher enters marks.</p>
                    </div>
                </div>
            </div>
        );
    }

    const data = {
        labels: marks.map(m => m.subject),
        datasets: [
            {
                label: 'Your Score',
                data: marks.map(m => m.studentTotal),
                backgroundColor: 'rgba(56, 189, 248, 0.85)',
                borderRadius: 6,
            },
            {
                label: 'Class Average',
                data: marks.map(m => m.classAvg),
                backgroundColor: 'rgba(156, 163, 175, 0.4)',
                borderRadius: 6,
            }
        ]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: { color: '#9ca3af', font: { size: 11 } }
            },
            tooltip: {
                callbacks: {
                    label: (ctx) => ` ${ctx.dataset.label}: ${ctx.parsed.y.toFixed(1)}`
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                max: 50,
                grid: { color: 'rgba(75,85,99,0.15)' },
                ticks: { color: '#9ca3af' }
            },
            x: {
                grid: { display: false },
                ticks: { color: '#9ca3af' }
            }
        }
    };

    return (
        <div className="card bg-base-100 shadow-xl border border-base-200">
            <div className="card-body">
                <h2 className="card-title text-sm uppercase text-base-content/50 mb-4 flex items-center gap-2">
                    <BarChart2 size={18} /> Performance vs Class
                </h2>
                <div className="h-56">
                    <Bar data={data} options={options} />
                </div>
            </div>
        </div>
    );
};

export default ComparativeChart;
