import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS, CategoryScale, LinearScale, BarElement,
    Title, Tooltip, Legend
} from 'chart.js';
import { getAcademicHealthFiltered } from '../../api/adminApi';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const SystemHealthChart = ({ department = 'All', semester, refreshKey = 0 }) => {
    const [chartData, setChartData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const params = {};
                if (department && department !== 'All') params.department = department;
                if (semester && semester !== 'All') params.semester = semester;
                const data = await getAcademicHealthFiltered(params);
                if (data && data.length > 0) {
                    setChartData({
                        labels: data.map(d => d.subject),
                        datasets: [
                            {
                                label: 'Avg Score',
                                data: data.map(d => d.averageScore),
                                backgroundColor: 'rgba(99, 102, 241, 0.7)',
                                borderColor: 'rgb(99, 102, 241)',
                                borderWidth: 1,
                                borderRadius: 4,
                            },
                            {
                                label: 'Pass Rate (%)',
                                data: data.map(d => d.passRate),
                                backgroundColor: 'rgba(16, 185, 129, 0.7)',
                                borderColor: 'rgb(16, 185, 129)',
                                borderWidth: 1,
                                borderRadius: 4,
                            },
                        ],
                    });
                } else {
                    setChartData(null);
                }
            } catch (error) {
                console.error('Failed to fetch academic health:', error);
                setChartData(null);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [department, semester, refreshKey]);

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top', labels: { usePointStyle: true, pointStyle: 'circle' } },
            title: {
                display: true,
                text: `Academic Health Overview${department !== 'All' ? ` — ${department}` : ''}`,
                font: { size: 14 },
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                max: 100,
                grid: { color: 'rgba(255,255,255,0.06)' },
            },
            x: {
                grid: { display: false },
            },
        },
    };

    return (
        <div className="card bg-base-100 shadow-xl">
            <div className="card-body p-6">
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <span className="loading loading-spinner loading-md"></span>
                    </div>
                ) : chartData ? (
                    <div style={{ height: '300px' }}>
                        <Bar data={chartData} options={options} />
                    </div>
                ) : (
                    <div className="flex flex-col justify-center items-center h-64 text-base-content/40">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-12 h-12 mb-3 opacity-30">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                        </svg>
                        <p className="text-sm">No academic data available yet.</p>
                        {department !== 'All' && <p className="text-xs mt-1">Try selecting a different department.</p>}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SystemHealthChart;
