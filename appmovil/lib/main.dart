import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:permission_handler/permission_handler.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Velocímetro GPS',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
        useMaterial3: true,
      ),
      home: const SpeedometerPage(),
    );
  }
}

class SpeedometerPage extends StatefulWidget {
  const SpeedometerPage({super.key});

  @override
  State<SpeedometerPage> createState() => _SpeedometerPageState();
}

class _SpeedometerPageState extends State<SpeedometerPage> {
  double _currentSpeed = 0.0;
  double _maxSpeed = 0.0;
  double _averageSpeed = 0.0;
  bool _isTracking = false;
  bool _hasPermission = false;
  String _status = 'Solicitando permisos...';
  List<double> _speedHistory = [];
  StreamSubscription<Position>? _positionStreamSubscription;

  @override
  void initState() {
    super.initState();
    _requestPermissions();
  }

  @override
  void dispose() {
    _positionStreamSubscription?.cancel();
    super.dispose();
  }

  Future<void> _requestPermissions() async {
    setState(() => _status = 'Solicitando permisos de ubicación...');

    final locationPermission = await Permission.location.request();
    if (locationPermission.isGranted) {
      setState(() {
        _hasPermission = true;
        _status = 'Permisos concedidos. Presiona "Iniciar" para comenzar.';
      });
    } else {
      setState(() => _status = 'Permisos de ubicación denegados');
    }
  }

  Future<void> _startTracking() async {
    if (!_hasPermission) {
      await _requestPermissions();
      return;
    }

    final serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      setState(() => _status = 'El GPS está desactivado. Actívalo para continuar.');
      return;
    }

    final locationSettings = const LocationSettings(
      accuracy: LocationAccuracy.high,
      distanceFilter: 0,
      timeLimit: Duration(seconds: 10),
    );

    setState(() {
      _isTracking = true;
      _status = 'Rastreando velocidad...';
      _speedHistory = [];
      _maxSpeed = 0.0;
      _averageSpeed = 0.0;
    });

    _positionStreamSubscription = Geolocator.getPositionStream(locationSettings: locationSettings)
        .listen((Position position) {
      if (position.speed != null && position.speed!.isFinite) {
        final speedKmh = position.speed! * 3.6; // Convertir m/s a km/h
        setState(() {
          _currentSpeed = speedKmh;
          if (speedKmh > _maxSpeed) {
            _maxSpeed = speedKmh;
          }
          _speedHistory.add(speedKmh);
          if (_speedHistory.isNotEmpty) {
            _averageSpeed = _speedHistory.reduce((a, b) => a + b) / _speedHistory.length;
          }
        });
      }
    });
  }

  void _stopTracking() {
    _positionStreamSubscription?.cancel();
    setState(() {
      _isTracking = false;
      _status = 'Rastreo detenido';
    });
  }

  void _reset() {
    _stopTracking();
    setState(() {
      _currentSpeed = 0.0;
      _maxSpeed = 0.0;
      _averageSpeed = 0.0;
      _speedHistory = [];
      _status = _hasPermission ? 'Presiona "Iniciar" para comenzar.' : 'Solicitando permisos...';
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
        title: const Text('Velocímetro GPS'),
        centerTitle: true,
      ),
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              Colors.blue.shade900,
              Colors.blue.shade500,
              Colors.blue.shade200,
            ],
          ),
        ),
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Speedometer Circle
              SizedBox(
                width: 300,
                height: 300,
                child: CustomPaint(
                  painter: SpeedometerPainter(
                    currentSpeed: _currentSpeed,
                    maxSpeedLimit: 200,
                  ),
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          '${_currentSpeed.toStringAsFixed(1)}',
                          style: const TextStyle(
                            fontSize: 72,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                        const Text(
                          'km/h',
                          style: TextStyle(
                            fontSize: 24,
                            color: Colors.white70,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 40),
              // Stats
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 40),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    _buildStatCard('Máxima', '${_maxSpeed.toStringAsFixed(1)} km/h'),
                    _buildStatCard('Promedio', '${_averageSpeed.toStringAsFixed(1)} km/h'),
                  ],
                ),
              ),
              const SizedBox(height: 40),
              // Status
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 40),
                child: Text(
                  _status,
                  style: const TextStyle(
                    fontSize: 16,
                    color: Colors.white,
                  ),
                  textAlign: TextAlign.center,
                ),
              ),
              const SizedBox(height: 40),
              // Buttons
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  if (!_isTracking)
                    ElevatedButton.icon(
                      onPressed: _startTracking,
                      icon: const Icon(Icons.play_arrow),
                      label: const Text('Iniciar'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.green,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
                        textStyle: const TextStyle(fontSize: 18),
                      ),
                    ),
                  if (_isTracking)
                    ElevatedButton.icon(
                      onPressed: _stopTracking,
                      icon: const Icon(Icons.stop),
                      label: const Text('Detener'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.red,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
                        textStyle: const TextStyle(fontSize: 18),
                      ),
                    ),
                  const SizedBox(width: 20),
                  ElevatedButton.icon(
                    onPressed: _reset,
                    icon: const Icon(Icons.refresh),
                    label: const Text('Reiniciar'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.grey,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
                      textStyle: const TextStyle(fontSize: 18),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatCard(String label, String value) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.2),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          Text(
            label,
            style: const TextStyle(
              fontSize: 14,
              color: Colors.white70,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: const TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
        ],
      ),
    );
  }
}

class SpeedometerPainter extends CustomPainter {
  final double currentSpeed;
  final double maxSpeedLimit;

  SpeedometerPainter({
    required this.currentSpeed,
    required this.maxSpeedLimit,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2 - 20;

    // Background arc
    final backgroundPaint = Paint()
      ..color = Colors.white.withOpacity(0.3)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 20
      ..strokeCap = StrokeCap.round;

    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      0.75 * 3.14159, // Start angle (135 degrees)
      1.5 * 3.14159, // Sweep angle (270 degrees)
      false,
      backgroundPaint,
    );

    // Speed arc
    final speedRatio = (currentSpeed / maxSpeedLimit).clamp(0.0, 1.0);
    final speedPaint = Paint()
      ..color = _getSpeedColor(currentSpeed)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 20
      ..strokeCap = StrokeCap.round;

    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      0.75 * 3.14159,
      1.5 * 3.14159 * speedRatio,
      false,
      speedPaint,
    );

    // Ticks
    for (int i = 0; i <= 10; i++) {
      final angle = 0.75 * 3.14159 + (1.5 * 3.14159 * i / 10);
      final innerRadius = radius - 35;
      final outerRadius = radius - 25;

      final startAngle = angle;
      final endAngle = angle;

      final tickPaint = Paint()
        ..color = Colors.white
        ..strokeWidth = 2;

      final x1 = center.dx + innerRadius * startAngle.cos;
      final y1 = center.dy + innerRadius * startAngle.sin;
      final x2 = center.dx + outerRadius * endAngle.cos;
      final y2 = center.dy + outerRadius * endAngle.sin;

      canvas.drawLine(Offset(x1, y1), Offset(x2, y2), tickPaint);
    }
  }

  Color _getSpeedColor(double speed) {
    if (speed < 30) return Colors.green;
    if (speed < 60) return Colors.yellow;
    if (speed < 90) return Colors.orange;
    return Colors.red;
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) {
    return true;
  }
}

extension on double {
  double get sin => this;
  double get cos => this;
}
