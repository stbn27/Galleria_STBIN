import sys
import json
import argparse

def main():
    parser = argparse.ArgumentParser(description="Curator Sidecar Stub")
    parser.add_argument("--dev", action="store_true", help="Run in development mode")
    args = parser.parse_args()

    if args.dev:
        print("Curator Sidecar started in DEV mode")
    
    # Simple loop to keep the sidecar alive and respond to input if needed
    while True:
        try:
            line = sys.stdin.readline()
            if not line:
                break
            
            data = json.loads(line)
            if data.get("command") == "ping":
                print(json.dumps({"status": "pong"}))
                sys.stdout.flush()
        except EOFError:
            break
        except Exception as e:
            print(json.dumps({"error": str(e)}))
            sys.stdout.flush()

if __name__ == "__main__":
    main()
