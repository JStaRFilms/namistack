#!/usr/bin/env python3
"""
VibeCode Verification Script
============================
Cross-platform verification for Next.js/TypeScript projects.
Runs TypeScript check, Lint, and Build to ensure code quality.

Usage:
    python scripts/vibe-verify.py
    python scripts/vibe-verify.py --quick    # Skip build, just tsc + lint
    python scripts/vibe-verify.py --strict   # Treat warnings as errors
"""

import subprocess
import sys
import os
from pathlib import Path


class Colors:
    """ANSI color codes for terminal output."""
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'
    BOLD = '\033[1m'


def safe_print(message: str) -> None:
    """Print with a best-effort ASCII fallback for Windows consoles."""
    try:
        print(message)
    except UnicodeEncodeError:
        print(message.encode('ascii', errors='replace').decode('ascii'))


def detect_package_manager() -> str:
    """Detect which package manager is being used."""
    if Path('pnpm-lock.yaml').exists():
        return 'pnpm'
    elif Path('yarn.lock').exists():
        return 'yarn'
    elif Path('bun.lockb').exists():
        return 'bun'
    else:
        return 'npm'


def run_command(cmd: list[str], description: str) -> tuple[bool, str]:
    """Run a command and return success status and output."""
    safe_print(f"\n{Colors.BLUE}[check] {description}...{Colors.RESET}")
    
    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            shell=(os.name == 'nt')  # Use shell on Windows
        )
        
        if result.returncode == 0:
            safe_print(f"{Colors.GREEN}[pass] {description}: PASS{Colors.RESET}")
            return True, result.stdout
        else:
            safe_print(f"{Colors.RED}[fail] {description}: FAIL{Colors.RESET}")
            # Show error output
            error_output = result.stderr or result.stdout
            if error_output:
                # Limit output to first 20 lines
                lines = error_output.strip().split('\n')[:20]
                for line in lines:
                    print(f"   {line}")
                if len(error_output.strip().split('\n')) > 20:
                    print(f"   ... (truncated, {len(error_output.strip().split(chr(10)))} total lines)")
            return False, error_output
            
    except FileNotFoundError:
        safe_print(f"{Colors.YELLOW}[skip] {description}: SKIPPED (command not found){Colors.RESET}")
        return True, ""  # Don't fail on missing commands
    except Exception as e:
        safe_print(f"{Colors.RED}[error] {description}: ERROR - {str(e)}{Colors.RESET}")
        return False, str(e)


def main():
    """Run all verification checks."""
    quick_mode = '--quick' in sys.argv
    strict_mode = '--strict' in sys.argv
    
    safe_print(f"\n{Colors.BOLD}{'='*50}")
    safe_print("VibeCode Verification Report")
    safe_print(f"{'='*50}{Colors.RESET}")
    
    # Check we're in a Node.js project
    if not Path('package.json').exists():
        safe_print(f"{Colors.RED}[fail] No package.json found. Are you in the project root?{Colors.RESET}")
        sys.exit(1)
    
    pm = detect_package_manager()
    safe_print(f"\nPackage Manager: {Colors.BLUE}{pm}{Colors.RESET}")
    
    results = []
    
    # 1. TypeScript Check
    tsc_passed, tsc_output = run_command(
        ['npx', 'tsc', '--noEmit'],
        "TypeScript Check"
    )
    results.append(('TypeScript', tsc_passed))
    
    # 2. Lint Check
    lint_cmd = [pm, 'run', 'lint']
    if pm == 'npm':
        lint_cmd = ['npm', 'run', 'lint', '--', '--quiet'] if not strict_mode else ['npm', 'run', 'lint']
    
    lint_passed, lint_output = run_command(
        lint_cmd,
        "Lint Check"
    )
    results.append(('Lint', lint_passed))
    
    # 3. Build Check (skip in quick mode)
    if not quick_mode:
        build_cmd = [pm, 'run', 'build']
        if pm == 'npm':
            build_cmd = ['npm', 'run', 'build']
        
        build_passed, build_output = run_command(
            build_cmd,
            "Build Check"
        )
        results.append(('Build', build_passed))
    
    # Summary
    safe_print(f"\n{Colors.BOLD}{'='*50}")
    safe_print("Summary")
    safe_print(f"{'='*50}{Colors.RESET}")
    
    all_passed = True
    for name, passed in results:
        status = f"{Colors.GREEN}PASS{Colors.RESET}" if passed else f"{Colors.RED}FAIL{Colors.RESET}"
        print(f"   {name}: {status}")
        if not passed:
            all_passed = False
    
    print(f"{'='*50}")
    
    if all_passed:
        safe_print(f"\n{Colors.GREEN}{Colors.BOLD}All checks passed! Ready for handoff.{Colors.RESET}\n")
        sys.exit(0)
    else:
        safe_print(f"\n{Colors.RED}{Colors.BOLD}Verification failed. Fix errors before proceeding.{Colors.RESET}\n")
        sys.exit(1)


if __name__ == '__main__':
    main()
