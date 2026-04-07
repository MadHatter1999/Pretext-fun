import { describe, expect, test } from 'vitest';

import {
  buildTerminalAsciiPowerShellScript,
  buildTerminalAsciiShellScript,
} from './terminalAsciiExport';

const SETTINGS = {
  brightness: 0.02,
  colorBoost: 1.24,
  contrast: 1.18,
  density: 1.1,
  invert: true,
  renderMode: 'variable' as const,
};

describe('terminal ASCII export scripts', () => {
  test('builds a Linux shell export with ffmpeg and python playback', () => {
    const script = buildTerminalAsciiShellScript(SETTINGS);

    expect(script).toContain('#!/usr/bin/env bash');
    expect(script).toContain('ffmpeg is required.');
    expect(script).toContain('ffprobe is required.');
    expect(script).toContain('ffplay is required unless you run with --mute.');
    expect(script).toContain('ASCII_VIDEO_PATH');
    expect(script).toContain('color-video-ascii.sh');
    expect(script).toContain('python3');
    expect(script).toContain('ASCII_RAMP');
    expect(script).toContain('--mute');
    expect(script).toContain('--once');
    expect(script).toContain('export ASCII_VIDEO_LOOP="$LOOP"');
    expect(script).toContain('export ASCII_VIDEO_MUTED="$MUTE"');
    expect(script).toContain('def start_audio(path):');
    expect(script).toContain('ffplay');
    expect(script).toContain('"-loop", "0"');
    expect(script).toContain('\\"invert\\":true');
    expect(script).toContain('\\"density\\":1.1');
  });

  test('builds a PowerShell export with Python stdin execution', () => {
    const script = buildTerminalAsciiPowerShellScript(SETTINGS);

    expect(script).toContain('param(');
    expect(script).toContain('[string]$Path = ""');
    expect(script).toContain('function Resolve-AsciiVideoPath');
    expect(script).toContain('System.Windows.Forms.OpenFileDialog');
    expect(script).toContain('Read-Host "Enter the path to a local video file"');
    expect(script).toContain('Usage: .\\color-video-ascii.ps1 -Path C:\\path\\to\\video.mp4');
    expect(script).toContain('(Resolve-Path -LiteralPath $Path -ErrorAction Stop).ProviderPath');
    expect(script).toContain('ffmpeg is required.');
    expect(script).toContain('ffplay is required unless you run with -Mute.');
    expect(script).toContain('$env:ASCII_VIDEO_PATH = $Path');
    expect(script).toContain('$pythonArgs = @("-3", "-")');
    expect(script).toContain("py -ErrorAction SilentlyContinue");
    expect(script).toContain('[switch]$Mute');
    expect(script).toContain('[switch]$NoLoop');
    expect(script).toContain('$env:ASCII_VIDEO_LOOP = if ($NoLoop) { "0" } else { "1" }');
    expect(script).toContain('$env:ASCII_VIDEO_MUTED = if ($Mute) { "1" } else { "0" }');
    expect(script).toContain('ASCII_RAMP');
    expect(script).toContain('\\"contrast\\":1.18');
    expect(script).toContain("'@ | & $pythonCommand @pythonArgs");
  });
});
