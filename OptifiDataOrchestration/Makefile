install:
	make migrations
	cargo build --release
	sudo cp optifi_data_orchestration.service /etc/systemd/system
	sudo systemctl daemon-reload

migrations:
	cd programs/orchestrator && diesel migration run