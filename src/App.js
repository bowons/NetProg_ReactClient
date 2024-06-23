import React, { useEffect, useState } from 'react';
import { Container, Typography, List, ListItem, ListItemText, Button, TextField, Card, CardContent, Grid } from "@mui/material";

function App() {
    const [sensorData, setSensorData] = useState({});
    const [controlData, setControlData] = useState({});

    useEffect(() => {
        fetch('http://localhost:8080/sensors')
            .then((response) => response.json())
            .then((data) => {
                const parsedData = Object.fromEntries(
                    Object.entries(data).map(([key, value]) => [key, JSON.parse(value)])
                );
                setSensorData(parsedData);
                setControlData(Object.fromEntries(
                    Object.entries(parsedData).map(([key, value]) => [key, {
                        temperature: formatValue(value.temperature),
                        humidity: formatValue(value.humidity),
                        light: formatValue(value.light)
                    }])
                ));
            })
            .catch((error) => console.error('Error:', error));
    }, []);

    useEffect(() => {
        const ws = new WebSocket('ws://localhost:8080/ws');

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            setSensorData((prevData) => ({ ...prevData, [data.location]: data }));
            setControlData((prevData) => ({
                ...prevData,
                [data.location]: {
                    temperature: formatValue(data.temperature),
                    humidity: formatValue(data.humidity),
                    light: formatValue(data.light)
                }
            }));
        };

        return () => ws.close();
    }, []);

    const handleInputChange = (location, field, value) => {
        setControlData((prevData) => ({
            ...prevData,
            [location]: {
                ...prevData[location],
                [field]: value
            }
        }));
    };

    const handleButtonClick = (location) => {
        const command = {
            location,
            temperature: parseFloat(controlData[location]?.temperature || 0),
            humidity: parseFloat(controlData[location]?.humidity || 0),
            light: parseFloat(controlData[location]?.light || 0)
        };

        fetch('http://localhost:8080/control', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(command),
        })
            .then((response) => response.json())
            .then((data) => {
                console.log('Success:', data);
            })
            .catch((error) => {
                console.error('Error:', error);
            });
    };

    const formatValue = (value) => parseFloat(value).toFixed(2);

    const renderSensorData = () => (
        <List>
            {Object.entries(sensorData).sort(([a], [b]) => a.localeCompare(b)).map(([location, data], index) => (
                <ListItem key={index}>
                    <Card variant="outlined" style={{ width: '100%' }}>
                        <CardContent>
                            <Grid container spacing={2} alignItems="center">
                                <Grid item xs={12}>
                                    <Typography variant="h6">{`Location: ${location}`}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <ListItemText primary={`이산화탄소: ${data.co2} ppm`} />
                                </Grid>
                                <Grid item xs={6}>
                                    <ListItemText primary={`미세먼지(PM2.5): ${data.pm2_5} µg/m³`} />
                                </Grid>
                                <Grid item xs={6}>
                                    <TextField
                                        label="온도"
                                        type="number"
                                        value={controlData[location]?.temperature || ''}
                                        onChange={(e) => handleInputChange(location, 'temperature', e.target.value)}
                                        margin="normal"
                                        fullWidth
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <TextField
                                        label="습도"
                                        type="number"
                                        value={controlData[location]?.humidity || ''}
                                        onChange={(e) => handleInputChange(location, 'humidity', e.target.value)}
                                        margin="normal"
                                        fullWidth
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <TextField
                                        label="채광량"
                                        type="number"
                                        value={controlData[location]?.light || ''}
                                        onChange={(e) => handleInputChange(location, 'light', e.target.value)}
                                        margin="normal"
                                        fullWidth
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <Button variant="contained" color="primary" onClick={() => handleButtonClick(location)} fullWidth>
                                        전송
                                    </Button>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </ListItem>
            ))}
        </List>
    );

    return (
        <Container>
            <Typography variant="h4" gutterBottom>
                Smart Farm 센서
            </Typography>
            <Card>
                <CardContent>
                    <Typography variant="h5" gutterBottom>
                        현재 상태
                    </Typography>
                    {renderSensorData()}
                </CardContent>
            </Card>
        </Container>
    );
}

export default App;
