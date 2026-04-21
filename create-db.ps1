$conn = New-Object System.Data.OleDb.OleDbConnection
$conn.ConnectionString = "Provider=MSDASQL;Driver={PostgreSQL Unicode};Server=localhost;Port=5432;Database=postgres;UID=postgres;PWD=postgres"
try {
    $conn.Open()
    Write-Host "Connected to postgres"
    $cmd = $conn.CreateCommand()
    $cmd.CommandText = "DROP DATABASE IF EXISTS inventory"
    $cmd.ExecuteNonQuery()
    Write-Host "Dropped inventory if existed"
    $cmd.CommandText = "CREATE DATABASE inventory"
    $cmd.ExecuteNonQuery()
    Write-Host "Created inventory database"
    $conn.Close()
    Write-Host "SUCCESS"
} catch {
    Write-Host $_.Exception.Message
}